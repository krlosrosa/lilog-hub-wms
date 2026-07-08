'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
import { FileSpreadsheet, Loader2 } from 'lucide-react';

const ACCEPTED_EXTENSIONS = '.xlsx,.xls';

export type ItinerarioImportResultado = {
  atualizados: number;
  naoEncontrados: number;
};

type ItinerarioImportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processando: boolean;
  onConfirmar: (arquivo: File) => Promise<ItinerarioImportResultado>;
};

function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ItinerarioImportModal({
  open,
  onOpenChange,
  processando,
  onConfirmar,
}: ItinerarioImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dragAtivo, setDragAtivo] = useState(false);
  const [resultado, setResultado] = useState<ItinerarioImportResultado | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      setArquivo(null);
      setDragAtivo(false);
      setResultado(null);
    }
  }, [open]);

  const selecionarArquivo = useCallback((file: File | null) => {
    if (!file) {
      return;
    }

    const nome = file.name.toLowerCase();
    const valido = nome.endsWith('.xlsx') || nome.endsWith('.xls');

    if (!valido) {
      return;
    }

    setArquivo(file);
    setResultado(null);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragAtivo(false);
      selecionarArquivo(event.dataTransfer.files?.[0] ?? null);
    },
    [selecionarArquivo],
  );

  const handleConfirmar = useCallback(async () => {
    if (!arquivo) {
      return;
    }

    const resumo = await onConfirmar(arquivo);
    setResultado(resumo);
  }, [arquivo, onConfirmar]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-outline-variant bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="size-5 text-primary" aria-hidden />
            Importar Itinerário
          </DialogTitle>
          <DialogDescription>
            Importe a planilha VL06O para vincular o itinerário às remessas do
            upload. Linhas sem itinerário são ignoradas.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(event) =>
            selecionarArquivo(event.target.files?.[0] ?? null)
          }
        />

        {!resultado ? (
          <>
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setDragAtivo(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragAtivo(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragAtivo(false);
              }}
              onDrop={handleDrop}
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all',
                dragAtivo
                  ? 'border-primary bg-primary/10'
                  : 'border-outline-variant hover:border-primary/50 hover:bg-primary/5',
              )}
            >
              <FileSpreadsheet
                className="size-12 text-muted-foreground"
                aria-hidden
              />
              <p className="mt-4 text-sm font-medium text-foreground">
                Arraste e solte a planilha VL06O aqui
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                XLS ou XLSX — colunas: Remessa, Itinerário
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-6 rounded-full"
                disabled={processando}
                onClick={() => inputRef.current?.click()}
              >
                Selecionar arquivo
              </Button>
            </div>

            {arquivo && (
              <div className="space-y-2 rounded-lg bg-surface-low p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Arquivo selecionado
                </p>
                <div className="flex justify-between text-sm">
                  <span className="truncate pr-3">{arquivo.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatarTamanhoArquivo(arquivo.size)}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3 rounded-lg bg-surface-low p-4">
            <p className="text-sm font-medium text-foreground">
              Importação concluída
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">
                  {resultado.atualizados}
                </span>{' '}
                remessa{resultado.atualizados !== 1 ? 's' : ''} atualizada
                {resultado.atualizados !== 1 ? 's' : ''}
              </li>
              <li>
                <span className="font-semibold text-foreground">
                  {resultado.naoEncontrados}
                </span>{' '}
                remessa{resultado.naoEncontrados !== 1 ? 's' : ''} não
                encontrada{resultado.naoEncontrados !== 1 ? 's' : ''} no upload
              </li>
            </ul>
          </div>
        )}

        <DialogFooter>
          {resultado ? (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={processando}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={processando || !arquivo}
                onClick={() => void handleConfirmar()}
                className="gap-2"
              >
                {processando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Processando…
                  </>
                ) : (
                  'Importar itinerário'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
