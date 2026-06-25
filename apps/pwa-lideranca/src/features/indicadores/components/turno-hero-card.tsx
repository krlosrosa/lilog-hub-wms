import { cn } from '@lilog/ui';
import { Activity, Clock, Radio, ShieldAlert } from 'lucide-react';

import type { TurnoStatus } from '@/features/indicadores/lib/torre-controle.schema';
import { PresencaProgressRing } from '@/features/sessao-presenca/components/presenca-progress-ring';

type TurnoHeroCardProps = {
  turno: TurnoStatus;
  unidadeNome: string | null;
  className?: string;
};

export function TurnoHeroCard({ turno, unidadeNome, className }: TurnoHeroCardProps) {
  const emRisco = turno.transportesEmRisco;
  const operacaoSaudavel = emRisco === 0;

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl bg-primary-container px-3 py-3 text-on-primary-container shadow-md',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary opacity-20 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-secondary opacity-10 blur-xl"
        aria-hidden
      />

      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-on-primary-container/70">
            Operação ao vivo
          </span>
        </div>

        <div className="flex items-center gap-3">
          <PresencaProgressRing
            percent={turno.progressoPercent}
            size="sm"
            variant="on-accent"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-1.5">
              <Activity className="h-4 w-4 shrink-0 text-on-secondary-container" aria-hidden />
              <h2 className="truncate text-title-lg font-bold leading-tight text-on-secondary-container">
                {turno.turnoLabel}
              </h2>
            </div>
            {unidadeNome ? (
              <p className="truncate text-body-sm font-medium text-on-primary-container/90">
                {unidadeNome}
              </p>
            ) : null}
            <p className="truncate text-label-sm text-on-primary-container/65">
              {turno.inicio} – {turno.fim}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          <div className="rounded-lg bg-on-primary-container/10 px-2.5 py-2 backdrop-blur-sm">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-on-primary-container/60">
              <Clock className="h-3 w-3" aria-hidden />
              Previsão fim
            </p>
            <p className="mt-1 font-mono text-label-md font-bold tabular-nums text-on-secondary-container">
              {turno.previsaoConclusao}
            </p>
          </div>
          <div
            className={cn(
              'rounded-lg px-2.5 py-2 backdrop-blur-sm',
              operacaoSaudavel
                ? 'bg-on-primary-container/10'
                : 'bg-destructive/20 ring-1 ring-destructive/30',
            )}
          >
            <p
              className={cn(
                'flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide',
                operacaoSaudavel
                  ? 'text-on-primary-container/60'
                  : 'text-destructive/90',
              )}
            >
              <ShieldAlert className="h-3 w-3" aria-hidden />
              Em risco
            </p>
            <p
              className={cn(
                'mt-1 font-mono text-label-md font-bold tabular-nums',
                operacaoSaudavel
                  ? 'text-on-secondary-container'
                  : 'text-destructive',
              )}
            >
              {emRisco}
            </p>
          </div>
        </div>

        {operacaoSaudavel ? (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-on-primary-container/75">
            <Radio className="h-3.5 w-3.5 text-tertiary" aria-hidden />
            Operação dentro do eixo
          </p>
        ) : null}
      </div>
    </article>
  );
}
