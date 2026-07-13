'use client';

import {
  ClipboardCheck,
  ThermometerSnowflake,
  TrendingDown,
  TriangleAlert,
} from 'lucide-react';
import { useMemo } from 'react';

import { cn } from '@lilog/ui';

import type { InspecaoTermica } from '@/features/recebimento/types/recebimento-detalhe.schema';

const CONDITION_ITEMS = [
  { key: 'limpeza' as const, label: 'Limpeza' },
  { key: 'odor' as const, label: 'Sem odor' },
  { key: 'estrutura' as const, label: 'Estrutura' },
  { key: 'vedacao' as const, label: 'Vedação' },
];

type InspecaoCardProps = {
  inspecao: InspecaoTermica;
};

function formatTemp(
  value: number | null,
  tempFmt: Intl.NumberFormat,
): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  return tempFmt.format(value);
}

export function InspecaoCard({ inspecao }: InspecaoCardProps) {
  const tempFmt = useMemo(
    () =>
      new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [],
  );

  const anomaliaCritico = inspecao.anomalias > 0;
  const checklistPreenchido = inspecao.checklistPreenchido === true;

  return (
    <section
      className="h-full rounded-lg border border-outline-variant/70 bg-glass-bg p-3.5 shadow-sm backdrop-blur-glass"
      aria-labelledby="titulo-inspecao"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="titulo-inspecao"
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary"
        >
          <ClipboardCheck className="size-3.5" aria-hidden />
          Checklist térmico
        </h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {inspecao.lacre ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-outline-variant/60 bg-muted/25 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
              Lacre {inspecao.lacre}
            </span>
          ) : null}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
              checklistPreenchido
                ? 'bg-tertiary/10 text-tertiary'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {checklistPreenchido ? 'Registrado' : 'Aguardando'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border border-outline-variant/50 border-l-2 border-l-status-active bg-muted/15 px-2.5 py-2">
          <p className="text-[9px] font-semibold uppercase text-muted-foreground">
            Baú
          </p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-bold tabular-nums text-foreground">
              {formatTemp(inspecao.tempBau, tempFmt)}
            </span>
            <span className="text-[10px] text-muted-foreground">°C</span>
          </div>
          <div className="mt-0.5 flex items-center gap-0.5 text-[9px] text-status-active">
            <TrendingDown className="size-2.5 shrink-0" aria-hidden />
            OK
          </div>
        </div>

        <div className="rounded-md border border-outline-variant/50 border-l-2 border-l-status-active bg-muted/15 px-2.5 py-2">
          <p className="text-[9px] font-semibold uppercase text-muted-foreground">
            Produto
          </p>
          <div className="mt-1 grid grid-cols-3 gap-1 text-center">
            {[
              { label: 'Ini', value: inspecao.tempProdutoInicio ?? inspecao.tempProduto },
              { label: 'Meio', value: inspecao.tempProdutoMeio },
              { label: 'Fim', value: inspecao.tempProdutoFim },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[8px] uppercase text-muted-foreground">
                  {item.label}
                </p>
                <p className="font-mono text-sm font-bold tabular-nums text-foreground">
                  {formatTemp(item.value ?? null, tempFmt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'rounded-md border border-outline-variant/50 border-l-2 bg-muted/15 px-2.5 py-2',
            anomaliaCritico ? 'border-l-destructive' : 'border-l-muted-foreground/35',
          )}
        >
          {anomaliaCritico ? (
            <>
              <p className="flex items-center gap-0.5 text-[9px] font-semibold uppercase text-destructive">
                <TriangleAlert className="size-2.5" aria-hidden />
                Anomalias
              </p>
              <span className="text-xl font-bold tabular-nums text-destructive">
                {String(inspecao.anomalias).padStart(2, '0')}
              </span>
              <p className="mt-0.5 line-clamp-2 text-[9px] leading-tight text-muted-foreground">
                {inspecao.anomaliasDescricao}
              </p>
            </>
          ) : (
            <>
              <p className="flex items-center gap-0.5 text-[9px] font-semibold uppercase text-muted-foreground">
                <ThermometerSnowflake className="size-2.5" aria-hidden />
                Anomalias
              </p>
              <span className="text-xl font-bold tabular-nums text-foreground">
                00
              </span>
              <p className="mt-0.5 text-[9px] text-muted-foreground">No SLA</p>
            </>
          )}
        </div>
      </div>

      {inspecao.conditions ? (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {CONDITION_ITEMS.map((item) => {
            const ok = inspecao.conditions?.[item.key] ?? false;

            return (
              <span
                key={item.key}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] font-medium',
                  ok
                    ? 'bg-status-active/10 text-status-active'
                    : 'bg-destructive/10 text-destructive',
                )}
              >
                {item.label}
              </span>
            );
          })}
        </div>
      ) : null}

      {inspecao.observacoes ? (
        <p className="mt-2.5 line-clamp-2 rounded-md border border-outline-variant/40 bg-muted/15 px-2.5 py-1.5 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Obs: </span>
          {inspecao.observacoes}
        </p>
      ) : null}
    </section>
  );
}
