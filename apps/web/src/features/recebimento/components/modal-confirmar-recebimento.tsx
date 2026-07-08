'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { AlertTriangle, DoorOpen, Loader2 } from 'lucide-react';

import { MOCK_DOCAS } from '@/features/recebimento/mocks/recebimentos-mock-data';
import type { RecebimentoDetalhe } from '@/features/recebimento/types/recebimento-detalhe.schema';

type ModalConfirmarRecebimentoProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (liberarPortaria: boolean) => void;
  recebimento: RecebimentoDetalhe;
  isSubmitting?: boolean;
};

type ResumoCardProps = {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
};

function ResumoCard({ label, value, valueClassName, className }: ResumoCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-outline-variant/30 bg-surface-highest/30 p-3',
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn('text-body-md font-bold text-foreground', valueClassName)}>
        {value}
      </p>
    </div>
  );
}

function resolverDocaLabel(placa: string): string {
  const doca = MOCK_DOCAS.find(
    (item) => item.status === 'ocupada' && item.placa === placa,
  );

  if (!doca) {
    return 'Não alocada';
  }

  return `Doca ${String(doca.numero).padStart(2, '0')}`;
}

function calcularTotalItens(recebimento: RecebimentoDetalhe): number {
  return recebimento.conferencia.reduce((acc, item) => acc + item.qtdFisica, 0);
}

function formatarUnidades(total: number): string {
  return `${new Intl.NumberFormat('pt-BR').format(total)} unidades`;
}

export function ModalConfirmarRecebimento({
  open,
  onClose,
  onConfirm,
  recebimento,
  isSubmitting = false,
}: ModalConfirmarRecebimentoProps) {
  const [liberarPortaria, setLiberarPortaria] = useState(false);

  useEffect(() => {
    if (!open) {
      setLiberarPortaria(false);
    }
  }, [open]);

  const resumo = useMemo(() => {
    const totalItens = calcularTotalItens(recebimento);
    const { numDivergencias, inspecao } = recebimento;

    return {
      totalItens: formatarUnidades(totalItens),
      divergencias:
        numDivergencias === 0
          ? '0 (Validadas)'
          : `${numDivergencias} pendente${numDivergencias > 1 ? 's' : ''}`,
      divergenciasOk: numDivergencias === 0,
      avarias: `${inspecao.anomalias} (Registrada${inspecao.anomalias !== 1 ? 's' : ''})`,
      temperatura:
        inspecao.tempProduto != null
          ? `OK (${inspecao.tempProduto.toFixed(1)}°C)`
          : inspecao.checklistPreenchido
            ? 'Sem leitura de produto'
            : 'Checklist pendente',
      doca: resolverDocaLabel(recebimento.placa),
    };
  }, [recebimento]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isSubmitting) {
        onClose();
      }
    },
    [isSubmitting, onClose],
  );

  const handleConfirm = useCallback(() => {
    onConfirm(liberarPortaria);
  }, [liberarPortaria, onConfirm]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-outline-variant bg-surface-low px-6 py-4 text-left">
          <DialogTitle className="text-headline-md font-bold text-primary">
            Finalizar Recebimento
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-2 md:gap-6 md:p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResumoCard label="Receipt ID" value={`#${recebimento.numero}`} />
              <ResumoCard label="Total Items" value={resumo.totalItens} />
              <ResumoCard
                label="Divergences"
                value={resumo.divergencias}
                valueClassName={
                  resumo.divergenciasOk ? 'text-status-active' : 'text-destructive'
                }
              />
              <ResumoCard
                label="Avarias"
                value={resumo.avarias}
                valueClassName="text-secondary"
              />
              <ResumoCard
                label="Temperature Status"
                value={resumo.temperatura}
                className="col-span-2"
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-primary-container/20 bg-primary-container/5 p-3">
              <DoorOpen className="size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Dock / Doca</p>
                <p className="text-body-md font-bold text-foreground">{resumo.doca}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-secondary-container/20 bg-secondary-container/10 p-4">
              <AlertTriangle className="size-5 shrink-0 text-secondary" aria-hidden />
              <p className="text-label-md font-medium leading-snug text-foreground">
                <span className="font-bold text-secondary">Atenção:</span> As divergências e
                avarias registradas gerarão automaticamente um registro CNC para tratamento
                junto à fábrica.
              </p>
            </div>

            <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/30 bg-surface-highest/20 p-4">
              <input
                type="checkbox"
                checked={liberarPortaria}
                disabled={isSubmitting}
                onChange={(event) => setLiberarPortaria(event.target.checked)}
                className="mt-0.5 size-5 shrink-0 rounded border-outline-variant bg-surface-highest text-primary transition-all focus:ring-primary focus:ring-offset-background disabled:opacity-50"
              />
              <span className="text-label-md leading-snug text-foreground transition-colors group-hover:text-primary">
                Liberar Portaria automaticamente após finalizar
              </span>
            </label>
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-outline-variant bg-surface-low p-4 md:px-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-outline-variant font-bold"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1 bg-gradient-to-r from-primary-container to-secondary-container font-bold text-primary-foreground shadow-lg hover:opacity-90"
            disabled={isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Finalizando…
              </>
            ) : (
              'Confirmar e Finalizar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
