'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { AlertTriangle, Clock, Wrench } from 'lucide-react';

import type {
  DocaItem,
  DocaStatus,
} from '@/features/recebimento/types/recebimento-lista.schema';

type FiltroStatusDoca = 'todos' | DocaStatus;

const FILTROS_STATUS: readonly { id: FiltroStatusDoca; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'disponivel', label: 'Livre' },
  { id: 'ocupada', label: 'Ocupada' },
  { id: 'manutencao', label: 'Manutenção' },
] as const;

type ModalAlocarDocaProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (docaNumero: number) => void;
  placa: string;
  docas: readonly DocaItem[];
};

function filtrarPorStatus(
  docas: readonly DocaItem[],
  filtro: FiltroStatusDoca,
): DocaItem[] {
  if (filtro === 'todos') {
    return [...docas];
  }

  return docas.filter((doca) => doca.status === filtro);
}

type DocaSelecionavelCardProps = {
  doca: DocaItem;
  selected: boolean;
  onSelect: (numero: number) => void;
};

function DocaSelecionavelCard({
  doca,
  selected,
  onSelect,
}: DocaSelecionavelCardProps) {
  const label = String(doca.numero).padStart(2, '0');

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
        <p className="text-caption text-muted-foreground">
          Retorno em {doca.retornoManutencao ?? '—'}
        </p>
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
        <div className="space-y-1">
          {doca.tempoOcupacao ? (
            <p className="flex items-center gap-1 text-caption text-destructive-foreground">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              {doca.tempoOcupacao}
            </p>
          ) : null}
          {doca.isPrioritaria ? (
            <p className="flex items-center gap-1 text-caption text-destructive-foreground">
              <AlertTriangle className="size-3.5 shrink-0 text-tertiary" aria-hidden />
              Prioritária
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(doca.numero)}
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
      {doca.capacidadeToneladas != null ? (
        <p className="text-caption text-muted-foreground">
          Capacidade: {doca.capacidadeToneladas}t
        </p>
      ) : null}
    </button>
  );
}

export function ModalAlocarDoca({
  open,
  onClose,
  onConfirm,
  placa,
  docas,
}: ModalAlocarDocaProps) {
  const [selectedDoca, setSelectedDoca] = useState<number | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusDoca>('todos');

  useEffect(() => {
    if (!open) {
      setSelectedDoca(null);
      setFiltroStatus('todos');
    }
  }, [open]);

  const docasFiltradas = useMemo(
    () => filtrarPorStatus(docas, filtroStatus),
    [docas, filtroStatus],
  );

  useEffect(() => {
    if (
      selectedDoca != null &&
      !docasFiltradas.some((d) => d.numero === selectedDoca)
    ) {
      setSelectedDoca(null);
    }
  }, [docasFiltradas, selectedDoca]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose],
  );

  const handleConfirm = useCallback(() => {
    if (selectedDoca == null) {
      return;
    }

    onConfirm(selectedDoca);
  }, [onConfirm, selectedDoca]);

  const temPrioridadeAlta = docas.some((d) => d.isPrioritaria);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto gap-0 p-0">
        <DialogHeader className="gap-1 border-b border-outline-variant bg-surface-low px-8 py-6 text-left">
          <DialogTitle className="text-headline-lg font-semibold tracking-tight text-primary">
            Alocar Doca de Descarga
          </DialogTitle>
          <DialogDescription className="text-body-md text-muted-foreground">
            Selecione uma doca disponível para o veículo{' '}
            <span className="font-bold text-secondary">{placa}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="p-8">
          <div className="mb-8 flex flex-wrap items-center gap-4 rounded-lg border border-outline-variant/30 bg-surface-highest/20 p-4">
            <div className="flex items-center gap-2">
              <div className="size-4 rounded border border-outline" aria-hidden />
              <span className="text-label-md uppercase tracking-wider text-muted-foreground">
                Doca Livre
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="size-4 rounded bg-destructive"
                aria-hidden
              />
              <span className="text-label-md uppercase tracking-wider text-muted-foreground">
                Doca Ocupada
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="size-4 rounded border border-outline-variant bg-surface-highest"
                aria-hidden
              />
              <span className="text-label-md uppercase tracking-wider text-muted-foreground">
                Manutenção
              </span>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-4">
              {temPrioridadeAlta ? (
                <div className="flex items-center gap-2 border-r border-outline-variant/30 pr-4">
                  <AlertTriangle className="size-5 text-tertiary" aria-hidden />
                  <span className="text-label-md text-tertiary">
                    Prioridade Alta
                  </span>
                </div>
              ) : null}

              <div
                className="flex rounded-lg border border-outline-variant bg-surface-low p-1"
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
                      'rounded px-3 py-1 text-xs font-medium transition-all',
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
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {docasFiltradas.map((doca) => (
              <DocaSelecionavelCard
                key={doca.numero}
                doca={doca}
                selected={selectedDoca === doca.numero}
                onSelect={setSelectedDoca}
              />
            ))}
          </div>

          {docasFiltradas.length === 0 ? (
            <p className="mb-8 text-center text-body-md text-muted-foreground">
              Nenhuma doca encontrada para o filtro selecionado.
            </p>
          ) : null}

          <div className="flex items-center justify-between border-t border-outline-variant pt-6">
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="border-outline-variant"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={selectedDoca == null}
                className={cn(
                  'bg-gradient-to-r from-primary-container to-secondary-container text-primary-foreground shadow-lg',
                  selectedDoca != null && 'hover:-translate-y-0.5 hover:shadow-primary/20',
                )}
                onClick={handleConfirm}
              >
                Confirmar Alocação
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
