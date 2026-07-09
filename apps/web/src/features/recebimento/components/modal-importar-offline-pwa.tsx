'use client';

import { useCallback, useEffect, useRef, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';
import type { Result } from '@zxing/library';
import { Camera, FileJson, Loader2, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

import { OfflineQrCameraView } from '@/features/recebimento/components/offline-qr-camera-view';
import { importOfflineRecebimento } from '@/features/recebimento/lib/recebimento-api';
import {
  filterPackageByDemandIds,
  mergeScanIntoPackageState,
  parseOfflineScan,
  isSyncExportPackage,
  assembleFromChunks,
  isSyncExportQrChunk,
} from '@/features/recebimento/lib/offline-sync/parse-offline-package';
import type {
  SyncExportPackage,
  SyncExportQrChunk,
} from '@/features/recebimento/lib/offline-sync/types';
import { ApiClientError } from '@/lib/api';

const VIDEO_ID = 'web-offline-import-qr-video';

type ImportMode = 'camera' | 'text';

type ModalImportarOfflinePwaProps = {
  open: boolean;
  onClose: () => void;
  demandId: string;
  recebimentoId: string | null | undefined;
  onImported?: () => void | Promise<void>;
};

export function ModalImportarOfflinePwa({
  open,
  onClose,
  demandId,
  recebimentoId,
  onImported,
}: ModalImportarOfflinePwaProps) {
  const [mode, setMode] = useState<ImportMode>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [chunks, setChunks] = useState<SyncExportQrChunk[]>([]);
  const [fullPackage, setFullPackage] = useState<SyncExportPackage | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastScanRef = useRef('');

  const demandIds = useMemo(() => {
    const ids = [demandId];
    if (recebimentoId) ids.push(recebimentoId);
    return ids;
  }, [demandId, recebimentoId]);

  const filteredPackage = useMemo(() => {
    if (!fullPackage) return null;
    return filterPackageByDemandIds(fullPackage, demandIds);
  }, [demandIds, fullPackage]);

  const resetState = useCallback(() => {
    setMode('camera');
    setCameraActive(false);
    setCameraError(null);
    setTextValue('');
    setChunks([]);
    setFullPackage(null);
    setStatusMessage(null);
    setParseError(null);
    setIsSubmitting(false);
    lastScanRef.current = '';
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    const timer = window.setTimeout(() => setCameraActive(true), 150);
    return () => window.clearTimeout(timer);
  }, [open, resetState]);

  const ingestRaw = useCallback((raw: string) => {
    setChunks((currentChunks) => {
      try {
        const result = mergeScanIntoPackageState({
          raw,
          currentPackage: null,
          chunks: currentChunks,
        });

        // Prefer assembled package from this scan when available.
        setFullPackage((prev) => result.package ?? prev);
        setStatusMessage(result.message);
        setParseError(null);
        return result.chunks;
      } catch (error) {
        setParseError(
          error instanceof Error ? error.message : 'Falha ao processar código',
        );
        return currentChunks;
      }
    });
  }, []);

  const handleCameraResult = useCallback(
    (result: Result | null, error: Error | null) => {
      if (error) {
        const name = error.name;
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setCameraError(
            'Permissão de câmera negada. Habilite nas configurações do navegador.',
          );
        }
        return;
      }

      if (!result) return;

      const text = result.getText().trim();
      if (!text || text === lastScanRef.current) return;
      lastScanRef.current = text;
      ingestRaw(text);
    },
    [ingestRaw],
  );

  const handleProcessText = useCallback(() => {
    const raw = textValue.trim();
    if (!raw) {
      setParseError('Cole o código ou JSON exportado pelo PWA.');
      return;
    }

    try {
      const parsed = parseOfflineScan(raw);
      if (isSyncExportPackage(parsed)) {
        setFullPackage(parsed);
        setChunks([]);
        setStatusMessage(
          `Pacote completo com ${parsed.entries.length} operação(ões).`,
        );
        setParseError(null);
        return;
      }

      if (isSyncExportQrChunk(parsed)) {
        const nextChunks = [parsed];
        if (parsed.n === 1) {
          const assembled = assembleFromChunks(nextChunks);
          setFullPackage(assembled);
          setChunks(nextChunks);
          setStatusMessage(
            `Pacote montado (${assembled.entries.length} operação(ões)).`,
          );
        } else {
          setChunks(nextChunks);
          setFullPackage(null);
          setStatusMessage(
            `Parte ${parsed.i + 1}/${parsed.n} recebida. Cole as demais partes ou use a câmera.`,
          );
        }
        setParseError(null);
        return;
      }
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : 'Falha ao processar texto',
      );
    }
  }, [textValue]);

  const handleImport = useCallback(async () => {
    if (!filteredPackage || filteredPackage.entries.length === 0) {
      toast.error('Nenhuma operação desta demanda encontrada no pacote');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await importOfflineRecebimento(demandId, {
        exportId: filteredPackage.exportId,
        unidadeId: filteredPackage.unidadeId,
        entries: filteredPackage.entries.map((entry) => ({
          outboxId: entry.outboxId,
          label: entry.label,
          endpoint: entry.endpoint,
          method: entry.method as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
          payload: entry.payload,
          createdAt: entry.createdAt,
          photoRefs: entry.photoRefs,
        })),
      });

      const errorSuffix =
        result.errors.length > 0
          ? ` · ${result.errors.length} com erro`
          : '';

      toast.success(
        `Importação concluída: ${result.appliedCount} aplicada(s), ${result.skippedCount} ignorada(s)${errorSuffix}`,
      );

      if (result.errors.length > 0) {
        toast.message('Algumas operações falharam', {
          description: result.errors
            .slice(0, 3)
            .map((item) => `${item.label}: ${item.message}`)
            .join(' · '),
        });
      }

      await onImported?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível importar o pacote offline',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [demandId, filteredPackage, onClose, onImported]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isSubmitting) {
        onClose();
      }
    },
    [isSubmitting, onClose],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-outline-variant bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Importar dados do PWA
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Escaneie o QR gerado no celular ou cole o código/JSON. Apenas
            operações desta demanda serão aplicadas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === 'camera' ? 'default' : 'outline'}
            className="h-8 gap-1.5"
            onClick={() => setMode('camera')}
          >
            <Camera className="size-3.5" aria-hidden />
            Câmera
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'text' ? 'default' : 'outline'}
            className="h-8 gap-1.5"
            onClick={() => setMode('text')}
          >
            <FileJson className="size-3.5" aria-hidden />
            Código / Texto
          </Button>
        </div>

        {mode === 'camera' ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Aponte para todos os QRs desta demanda (formato compacto KLS2),
              na ordem, até o pacote ficar completo. Também aceita JSON legado.
            </p>
            <div className="relative h-64 overflow-hidden rounded-lg border border-outline-variant bg-black">
              {cameraError ? (
                <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-destructive">
                  {cameraError}
                </p>
              ) : cameraActive && open ? (
                <>
                  <OfflineQrCameraView
                    videoId={VIDEO_ID}
                    onResult={handleCameraResult}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex h-40 w-40 items-center justify-center rounded-lg border-2 border-white/70">
                      <ScanLine className="size-5 text-white/80" aria-hidden />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Cole o conteúdo lido pelo leitor 2D (KLS2:...) ou o JSON
              exportado no PWA.
            </p>
            <textarea
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              rows={8}
              placeholder="KLS2:... ou {&quot;version&quot;:1,&quot;exportId&quot;:&quot;...&quot;,&quot;entries&quot;:[...]}"
              className={cn(
                'w-full rounded-lg border border-outline-variant bg-background px-3 py-2 font-mono text-xs text-foreground',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleProcessText}
            >
              Processar código
            </Button>
          </div>
        )}

        {statusMessage ? (
          <p className="rounded-md border border-outline-variant/60 bg-muted/40 px-3 py-2 text-xs text-foreground">
            {statusMessage}
          </p>
        ) : null}

        {parseError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {parseError}
          </p>
        ) : null}

        {filteredPackage ? (
          <div className="rounded-lg border border-outline-variant bg-muted/30 px-3 py-3 text-sm">
            <p className="font-medium text-foreground">
              Resumo para esta demanda
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Export #{filteredPackage.exportId} ·{' '}
              {filteredPackage.entries.length} operação(ões) filtrada(s)
              {fullPackage &&
              fullPackage.entries.length !== filteredPackage.entries.length
                ? ` (de ${fullPackage.entries.length} no pacote)`
                : ''}
            </p>
            {filteredPackage.entries.length > 0 ? (
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                {filteredPackage.entries.slice(0, 8).map((entry) => (
                  <li key={`${entry.outboxId}-${entry.createdAt}`}>
                    {entry.method} {entry.label}
                  </li>
                ))}
                {filteredPackage.entries.length > 8 ? (
                  <li>… e mais {filteredPackage.entries.length - 8}</li>
                ) : null}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-destructive">
                Nenhuma operação deste pré-recebimento/recebimento no pacote.
              </p>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={
              isSubmitting ||
              !filteredPackage ||
              filteredPackage.entries.length === 0
            }
            onClick={() => void handleImport()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Importando…
              </>
            ) : (
              'Confirmar importação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
