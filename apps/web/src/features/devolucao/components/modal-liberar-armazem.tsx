'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { Loader2, Warehouse } from 'lucide-react';

import { listDocas } from '@/features/docas/lib/docas-api';
import type { DocaApi } from '@/features/docas/types/doca.api';

export type LiberarArmazemFormValues = {
  doca: string | null;
  cargaSegregada: boolean;
  paletesEsperados: number;
};

type ModalLiberarArmazemProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (values: LiberarArmazemFormValues) => void | Promise<void>;
  codigoDemanda: string;
  unidadeId?: string | null;
  isLoading?: boolean;
};

function formatDocaLabel(doca: DocaApi): string {
  return `${doca.codigo} — ${doca.nome}`;
}

export function ModalLiberarArmazem({
  open,
  onClose,
  onConfirm,
  codigoDemanda,
  unidadeId,
  isLoading = false,
}: ModalLiberarArmazemProps) {
  const [docaId, setDocaId] = useState('');
  const [docas, setDocas] = useState<DocaApi[]>([]);
  const [isLoadingDocas, setIsLoadingDocas] = useState(false);
  const [docasLoadError, setDocasLoadError] = useState<string | null>(null);
  const [cargaSegregada, setCargaSegregada] = useState(false);
  const [paletesEsperados, setPaletesEsperados] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDocaId('');
      setDocas([]);
      setDocasLoadError(null);
      setCargaSegregada(false);
      setPaletesEsperados('');
      setError(null);
      return;
    }

    if (!unidadeId) {
      setDocas([]);
      setDocasLoadError('Selecione uma unidade para carregar as docas.');
      return;
    }

    let cancelled = false;

    setIsLoadingDocas(true);
    setDocasLoadError(null);

    void listDocas({ unidadeId, limit: 100 })
      .then((response) => {
        if (cancelled) return;

        const items = [...response.items].sort((a, b) =>
          a.codigo.localeCompare(b.codigo, 'pt-BR'),
        );

        setDocas(items);
        setDocaId('');
      })
      .catch(() => {
        if (cancelled) return;
        setDocas([]);
        setDocasLoadError('Não foi possível carregar as docas da unidade.');
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDocas(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, unidadeId]);

  const handleConfirm = () => {
    const parsedPaletes = Number(paletesEsperados.trim());

    if (
      paletesEsperados.trim() === '' ||
      !Number.isInteger(parsedPaletes) ||
      parsedPaletes < 0
    ) {
      setError('Informe a quantidade de paletes esperados.');
      return;
    }

    const selectedDoca = docas.find((doca) => doca.id === docaId);

    setError(null);
    void onConfirm({
      doca: selectedDoca ? formatDocaLabel(selectedDoca) : null,
      cargaSegregada,
      paletesEsperados: parsedPaletes,
    });
  };

  const formDisabled = isLoading || isLoadingDocas;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border-outline-variant bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Warehouse className="size-4 text-secondary" aria-hidden />
            Liberar para armazém
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Informe os dados operacionais para liberar a demanda{' '}
            <span className="font-medium text-foreground">{codigoDemanda}</span>{' '}
            para conferência no PWA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <label
              htmlFor="liberar-doca"
              className="text-xs font-medium text-foreground"
            >
              Doca (opcional)
            </label>
            {isLoadingDocas ? (
              <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando docas...
              </div>
            ) : (
              <select
                id="liberar-doca"
                value={docaId}
                onChange={(event) => setDocaId(event.target.value)}
                disabled={formDisabled || docas.length === 0}
                className="w-full rounded-md border border-outline-variant bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Sem doca definida</option>
                {docas.map((doca) => (
                  <option key={doca.id} value={doca.id}>
                    {formatDocaLabel(doca)}
                  </option>
                ))}
              </select>
            )}
            {docasLoadError ? (
              <p className="text-xs text-destructive">{docasLoadError}</p>
            ) : null}
            {!isLoadingDocas &&
            !docasLoadError &&
            docas.length === 0 &&
            unidadeId ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma doca cadastrada para esta unidade.
              </p>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={cargaSegregada}
              onChange={(event) => setCargaSegregada(event.target.checked)}
              disabled={formDisabled}
              className="size-4 rounded border-outline-variant"
            />
            Carga para segregar
          </label>

          <div className="space-y-1.5">
            <label
              htmlFor="liberar-paletes"
              className="text-xs font-medium text-foreground"
            >
              Paletes esperados
            </label>
            <input
              id="liberar-paletes"
              type="number"
              min={0}
              step={1}
              value={paletesEsperados}
              onChange={(event) => {
                setPaletesEsperados(event.target.value);
                setError(null);
              }}
              placeholder="Ex.: 12"
              disabled={formDisabled}
              className="w-full rounded-md border border-outline-variant bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={formDisabled || Boolean(docasLoadError)}
            className="gap-1.5"
          >
            Liberar armazém
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
