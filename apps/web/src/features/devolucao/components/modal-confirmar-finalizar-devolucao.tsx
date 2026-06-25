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
import { AlertTriangle, Warehouse } from 'lucide-react';

import type {
  ConferenceItem,
  DemandaDetalhe,
} from '@/features/devolucao/types/devolucao-detalhes.schema';
import { isTemperaturaForaFaixa } from '@/features/devolucao/types/devolucao-detalhes.schema';

type FinalizarDevolucaoOpcoes = {
  liberarDoca: boolean;
  gerarLiberacaoAutomatica: boolean;
};

type ModalConfirmarFinalizarDevolucaoProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (opcoes: FinalizarDevolucaoOpcoes) => void;
  detalhe: DemandaDetalhe;
  conferenceItems: readonly ConferenceItem[];
  isLoading?: boolean;
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

function contarDivergencias(itens: readonly ConferenceItem[]): number {
  return itens.filter(
    (item) =>
      item.status === 'divergente' ||
      (item.status !== 'concluido' && item.confirmado !== item.previsto),
  ).length;
}

function formatarUnidades(total: number): string {
  return `${new Intl.NumberFormat('pt-BR').format(total)} unidades`;
}

function formatTemp(valor: number): string {
  return `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}°C`;
}

export function ModalConfirmarFinalizarDevolucao({
  open,
  onClose,
  onConfirm,
  detalhe,
  conferenceItems,
  isLoading = false,
}: ModalConfirmarFinalizarDevolucaoProps) {
  const [liberarDoca, setLiberarDoca] = useState(false);
  const [gerarLiberacaoAutomatica, setGerarLiberacaoAutomatica] = useState(false);

  useEffect(() => {
    if (!open) {
      setLiberarDoca(false);
      setGerarLiberacaoAutomatica(false);
    }
  }, [open]);

  const resumo = useMemo(() => {
    const numDivergencias = contarDivergencias(conferenceItems);
    const tempBauOk = !isTemperaturaForaFaixa(
      detalhe.temperaturaBau,
      detalhe.temperaturaBauAlvo,
    );
    const tempProdutoOk = !isTemperaturaForaFaixa(
      detalhe.temperaturaProduto,
      detalhe.temperaturaProdutoAlvo,
    );

    return {
      totalItens: formatarUnidades(detalhe.totalItens),
      divergencias:
        numDivergencias === 0
          ? '0 (Validadas)'
          : `${numDivergencias} pendente${numDivergencias > 1 ? 's' : ''}`,
      divergenciasOk: numDivergencias === 0,
      temperaturaBau: `${tempBauOk ? 'OK' : 'Alerta'} (${formatTemp(detalhe.temperaturaBau)})`,
      temperaturaProduto: `${tempProdutoOk ? 'OK' : 'Alerta'} (${formatTemp(detalhe.temperaturaProduto)})`,
      tempOk: tempBauOk && tempProdutoOk,
    };
  }, [conferenceItems, detalhe]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isLoading) onClose();
    },
    [isLoading, onClose],
  );

  const handleConfirm = useCallback(() => {
    onConfirm({ liberarDoca, gerarLiberacaoAutomatica });
  }, [gerarLiberacaoAutomatica, liberarDoca, onConfirm]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-outline-variant bg-surface-low px-6 py-4 text-left">
          <DialogTitle className="text-headline-md font-bold text-primary">
            Finalizar Processo
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 md:grid-cols-2 md:gap-6 md:p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResumoCard label="Placa" value={detalhe.placa} />
              <ResumoCard label="ID Viagem" value={detalhe.viagemId} />
              <ResumoCard label="Total de Itens" value={resumo.totalItens} />
              <ResumoCard
                label="Divergências"
                value={resumo.divergencias}
                valueClassName={
                  resumo.divergenciasOk ? 'text-tertiary' : 'text-destructive'
                }
              />
              <ResumoCard
                label="Temp. do Baú"
                value={resumo.temperaturaBau}
                valueClassName={resumo.tempOk ? 'text-tertiary' : 'text-destructive'}
              />
              <ResumoCard
                label="Temp. do Produto"
                value={resumo.temperaturaProduto}
                valueClassName={resumo.tempOk ? 'text-tertiary' : 'text-destructive'}
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-primary-container/20 bg-primary-container/5 p-3">
              <Warehouse className="size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">
                  Motorista
                </p>
                <p className="text-body-md font-bold text-foreground">
                  {detalhe.motorista}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4">
            <div className="flex items-start gap-3 rounded-lg border border-secondary-container/20 bg-secondary-container/10 p-4">
              <AlertTriangle className="size-5 shrink-0 text-secondary" aria-hidden />
              <p className="text-label-md font-medium leading-snug text-foreground">
                <span className="font-bold text-secondary">Atenção:</span> As
                diferenças identificadas na conferência serão enviadas
                automaticamente ao{' '}
                <span className="font-bold">depósito</span> para tratativa
                operacional e poderão gerar{' '}
                <span className="font-bold">débito à transportadora</span>.
              </p>
            </div>

            <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/30 bg-surface-highest/20 p-4">
              <input
                type="checkbox"
                checked={liberarDoca}
                onChange={(e) => setLiberarDoca(e.target.checked)}
                disabled={isLoading}
                className="mt-0.5 size-5 shrink-0 rounded border-outline-variant bg-surface-highest text-primary transition-all focus:ring-primary focus:ring-offset-background"
              />
              <span className="text-label-md leading-snug text-foreground transition-colors group-hover:text-primary">
                Liberar doca automaticamente após finalizar
              </span>
            </label>

            <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant/30 bg-surface-highest/20 p-4">
              <input
                type="checkbox"
                checked={gerarLiberacaoAutomatica}
                onChange={(e) => setGerarLiberacaoAutomatica(e.target.checked)}
                disabled={isLoading}
                className="mt-0.5 size-5 shrink-0 rounded border-outline-variant bg-surface-highest text-primary transition-all focus:ring-primary focus:ring-offset-background"
              />
              <span className="text-label-md leading-snug text-foreground transition-colors group-hover:text-primary">
                Gerar liberação automática após finalizar
              </span>
            </label>
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-outline-variant bg-surface-low p-4 md:px-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-outline-variant font-bold"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1 bg-gradient-to-r from-primary-container to-secondary-container font-bold text-primary-foreground shadow-lg hover:opacity-90"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            Confirmar e Finalizar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { contarDivergencias };
export type { FinalizarDevolucaoOpcoes };
