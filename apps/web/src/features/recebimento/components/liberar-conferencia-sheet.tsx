'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { AlertTriangle, Loader2, Unlock, Wrench } from 'lucide-react';

import { listDocas } from '@/features/docas/lib/docas-api';
import {
  mapDocaApiToSelecaoItem,
  sortDocasSelecao,
  type DocaSelecaoItem,
} from '@/features/recebimento/lib/map-docas-recebimento';
import type {
  DocaStatus,
} from '@/features/recebimento/types/recebimento-lista.schema';

type FiltroStatusDoca = 'todos' | DocaStatus;

const FILTROS_STATUS: readonly { id: FiltroStatusDoca; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'disponivel', label: 'Livre' },
  { id: 'ocupada', label: 'Ocupada' },
  { id: 'manutencao', label: 'Manutenção' },
] as const;

type LiberarConferenciaSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (docaId: string) => Promise<void>;
  placa: string;
  unidadeId?: string | null;
  isSubmitting?: boolean;
};

function filtrarPorStatus(
  docas: readonly DocaSelecaoItem[],
  filtro: FiltroStatusDoca,
): DocaSelecaoItem[] {
  if (filtro === 'todos') {
    return [...docas];
  }

  return docas.filter((doca) => doca.status === filtro);
}

type DocaSelecionavelCardProps = {
  doca: DocaSelecaoItem;
  selected: boolean;
  onSelect: (id: string) => void;
};

function DocaSelecionavelCard({
  doca,
  selected,
  onSelect,
}: DocaSelecionavelCardProps) {
  const label = doca.codigo.padStart(2, '0');

  if (doca.status === 'manutencao') {
    return (
      <div
        className="flex flex-col rounded-lg border border-outline-variant bg-surface-highest/40 p-4 opacity-80 shadow-inner grayscale"
        aria-disabled
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-headline-md font-bold text-muted-foreground">
            {label}
          </span>
          <Wrench className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <p className="truncate text-caption text-muted-foreground">{doca.nome}</p>
      </div>
    );
  }

  if (doca.status === 'ocupada') {
    return (
      <div
        className="flex flex-col rounded-lg border border-destructive/50 bg-destructive/10 p-4 opacity-80 shadow-inner"
        aria-disabled
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-headline-md font-bold text-destructive-foreground">
            {label}
          </span>
          <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-medium uppercase text-destructive-foreground">
            Ocupada
          </span>
        </div>
        <p className="truncate text-caption text-destructive-foreground">
          {doca.nome}
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(doca.id)}
      className={cn(
        'flex flex-col rounded-lg border border-outline-variant bg-surface-low p-4 text-left shadow-inner transition-all',
        'hover:border-primary/50 hover:bg-primary/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected &&
          'border-primary bg-primary/10 shadow-[0_0_15px] shadow-primary/20',
      )}
      aria-pressed={selected}
      aria-label={`Doca ${label}, livre`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={cn(
            'text-headline-md font-bold text-primary',
            selected && 'text-secondary',
          )}
        >
          {label}
        </span>
        <span className="rounded-full bg-tertiary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-tertiary">
          Livre
        </span>
      </div>
      <p className="truncate text-caption text-muted-foreground">{doca.nome}</p>
      {doca.capacidadeToneladas != null ? (
        <p className="mt-1 text-caption text-muted-foreground">
          Capacidade: {doca.capacidadeToneladas} veículo(s)
        </p>
      ) : null}
    </button>
  );
}

export function LiberarConferenciaSheet({
  open,
  onOpenChange,
  onConfirm,
  placa,
  unidadeId,
  isSubmitting = false,
}: LiberarConferenciaSheetProps) {
  const [selectedDocaId, setSelectedDocaId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusDoca>('disponivel');
  const [docas, setDocas] = useState<DocaSelecaoItem[]>([]);
  const [isLoadingDocas, setIsLoadingDocas] = useState(false);
  const [docasLoadError, setDocasLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSelectedDocaId(null);
      setFiltroStatus('disponivel');
      setDocas([]);
      setDocasLoadError(null);
      setError(null);
      return;
    }

    if (!unidadeId) {
      setDocas([]);
      setDocasLoadError('Unidade não informada para carregar as docas.');
      return;
    }

    let cancelled = false;

    setIsLoadingDocas(true);
    setDocasLoadError(null);

    void listDocas({ unidadeId, limit: 100 })
      .then((response) => {
        if (cancelled) return;

        const recebimentoDocas = response.items
          .filter(
            (doca) =>
              doca.tipo === 'recebimento' || doca.tipo === 'compartilhada',
          )
          .map(mapDocaApiToSelecaoItem);

        setDocas(sortDocasSelecao(recebimentoDocas));
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

  const docasFiltradas = useMemo(
    () => filtrarPorStatus(docas, filtroStatus),
    [docas, filtroStatus],
  );

  useEffect(() => {
    if (
      selectedDocaId != null &&
      !docasFiltradas.some((doca) => doca.id === selectedDocaId)
    ) {
      setSelectedDocaId(null);
    }
  }, [docasFiltradas, selectedDocaId]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isSubmitting) {
        return;
      }

      onOpenChange(nextOpen);
    },
    [isSubmitting, onOpenChange],
  );

  const handleConfirm = async () => {
    if (!selectedDocaId) {
      setError('Selecione uma doca disponível para continuar.');
      return;
    }

    setError(null);

    try {
      await onConfirm(selectedDocaId);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível liberar para conferência';
      setError(message);
    }
  };

  const formDisabled = isSubmitting || isLoadingDocas;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl md:max-w-2xl"
      >
        <SheetHeader className="shrink-0 border-b border-outline-variant bg-surface-highest/30 px-6 py-5 text-left">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Unlock className="size-4 text-primary" aria-hidden />
            Liberar para conferência
          </SheetTitle>
          <SheetDescription>
            Selecione a doca de descarga para o veículo{' '}
            <span className="font-semibold text-foreground">{placa}</span>.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-highest/20 p-3">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded border border-outline" aria-hidden />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Livre
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-destructive" aria-hidden />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Ocupada
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="size-3 rounded border border-outline-variant bg-surface-highest"
                aria-hidden
              />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Indisponível
              </span>
            </div>

            <div
              className="ml-auto flex rounded-lg border border-outline-variant bg-surface-low p-1"
              role="tablist"
              aria-label="Filtrar docas por status"
            >
              {FILTROS_STATUS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filtroStatus === id}
                  onClick={() => setFiltroStatus(id)}
                  className={cn(
                    'rounded px-2.5 py-1 text-[11px] font-medium transition-all',
                    filtroStatus === id
                      ? 'bg-primary-container text-on-primary-container shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isLoadingDocas ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando mapa de docas...
            </div>
          ) : docasLoadError ? (
            <p className="py-8 text-center text-sm text-destructive">
              {docasLoadError}
            </p>
          ) : docasFiltradas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma doca encontrada para o filtro selecionado.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {docasFiltradas.map((doca) => (
                <DocaSelecionavelCard
                  key={doca.id}
                  doca={doca}
                  selected={selectedDocaId === doca.id}
                  onSelect={setSelectedDocaId}
                />
              ))}
            </div>
          )}

          {docas.some((doca) => doca.isPrioritaria) ? (
            <div className="mt-4 flex items-center gap-2 text-xs text-tertiary">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              Existem docas com prioridade alta em operação.
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <SheetFooter className="flex shrink-0 flex-row gap-2 border-t border-outline-variant px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={
              formDisabled ||
              Boolean(docasLoadError) ||
              selectedDocaId == null ||
              docas.length === 0
            }
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Liberando…
              </>
            ) : (
              'Liberar conferência'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
