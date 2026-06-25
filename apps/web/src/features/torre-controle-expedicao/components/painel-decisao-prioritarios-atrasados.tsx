'use client';

import { AlertTriangle, ArrowRight, Eye } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { PrioridadeTransporteBadge } from '@/features/transporte/components/prioridade-transporte-badge';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import { RiscoBadge } from '@/features/torre-controle-expedicao/components/risco-badge';
import { metaLargadaClassName } from '@/features/torre-controle-expedicao/lib/formatar-tempo';
import { resumoAtrasoExpedicao } from '@/features/torre-controle-expedicao/components/tempo-restante-expedicao';
import type {
  FiltroRapidoTorre,
  TransporteRisco,
} from '@/features/torre-controle-expedicao/types/torre-controle.schema';

type PainelDecisaoPrioritariosAtrasadosProps = {
  transportes: TransporteRisco[];
  onVerTransporte: (transporte: TransporteRisco) => void;
  onVerTodos: (filtro: FiltroRapidoTorre) => void;
  className?: string;
};

export function PainelDecisaoPrioritariosAtrasados({
  transportes,
  onVerTransporte,
  onVerTodos,
  className,
}: PainelDecisaoPrioritariosAtrasadosProps) {
  if (transportes.length === 0) {
    return null;
  }

  const destaques = transportes.slice(0, 5);

  return (
    <section
      id="painel-decisao-prioritarios"
      className={cn(
        glassPanelClassName,
        'overflow-hidden rounded-xl border-destructive/20',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant bg-destructive/5 px-gutter py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" aria-hidden />
          <h2 className="text-label-md font-semibold text-foreground">
            Prioritários que precisam de ação
          </h2>
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-destructive">
            {transportes.length}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => onVerTodos('prioritarios_atrasados')}
        >
          Ver todos na tabela
          <ArrowRight className="size-3.5" aria-hidden />
        </Button>
      </div>

      <ul className="divide-y divide-outline-variant/60">
        {destaques.map((transporte) => {
          const atrasoResumo = resumoAtrasoExpedicao(
            transporte.tempoRestanteSaidaMin,
            transporte.tempoRestanteSaidaSeg,
          );

          return (
          <li
            key={transporte.id}
            className="flex flex-col gap-3 px-gutter py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">
                  {transporte.codigo}
                </span>
                <RiscoBadge nivel={transporte.nivelRisco} />
                {transporte.isPrioridade && transporte.nivelPrioridade ? (
                  <PrioridadeTransporteBadge nivel={transporte.nivelPrioridade} />
                ) : transporte.prioridade ? (
                  <span className="inline-flex rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary ring-1 ring-inset ring-secondary/20">
                    Reentrega
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {transporte.placa} · {transporte.transportadora} · meta{' '}
                <span className={cn(metaLargadaClassName, 'text-foreground')}>
                  {transporte.horarioSaida}
                </span>
                {atrasoResumo ? (
                  <>
                    {' '}
                    ·{' '}
                    <span className="font-medium tabular-nums text-destructive">
                      {atrasoResumo}
                    </span>
                  </>
                ) : null}
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 shrink-0 gap-1 text-xs"
              onClick={() => onVerTransporte(transporte)}
            >
              <Eye className="size-3.5" aria-hidden />
              Ver detalhes
            </Button>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
