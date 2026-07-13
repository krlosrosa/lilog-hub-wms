'use client';

import { cn } from '@lilog/ui';

import type { AlertaPainel } from '@/features/recebimento-painel/types/recebimento-painel.schema';

const SEVERIDADE_LABEL: Record<AlertaPainel['severidade'], string> = {
  error: 'Crítico',
  warning: 'Atenção',
  info: 'Info',
};

const SEVERIDADE_COLOR: Record<AlertaPainel['severidade'], string> = {
  error: 'text-destructive',
  warning: 'text-amber-400',
  info: 'text-sky-400',
};

export function RecebimentoAlertasTicker({
  alertas,
  className,
}: {
  alertas: AlertaPainel[];
  className?: string;
}) {
  const items = alertas.slice(0, 8);

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-md',
        className,
      )}
      aria-label="Alertas operacionais"
    >
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-destructive/80">
        Alertas
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <ul className="flex animate-dashboard-marquee gap-6">
          {items.map((alerta) => (
            <li
              key={alerta.id}
              className="flex shrink-0 items-center gap-2 text-[11px] text-white/60"
            >
              <span
                className={cn(
                  'font-semibold uppercase',
                  SEVERIDADE_COLOR[alerta.severidade],
                )}
              >
                {SEVERIDADE_LABEL[alerta.severidade]}
              </span>
              <span className="text-white/80">{alerta.mensagem}</span>
              {alerta.placa ? (
                <span className="font-mono text-white/40">{alerta.placa}</span>
              ) : null}
            </li>
          ))}
          {items.map((alerta) => (
            <li
              key={`${alerta.id}-dup`}
              className="flex shrink-0 items-center gap-2 text-[11px] text-white/60"
              aria-hidden
            >
              <span
                className={cn(
                  'font-semibold uppercase',
                  SEVERIDADE_COLOR[alerta.severidade],
                )}
              >
                {SEVERIDADE_LABEL[alerta.severidade]}
              </span>
              <span className="text-white/80">{alerta.mensagem}</span>
              {alerta.placa ? (
                <span className="font-mono text-white/40">{alerta.placa}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
