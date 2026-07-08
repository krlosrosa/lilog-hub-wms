import { useParams } from '@tanstack/react-router';
import {
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '@lilog/ui';

import {
  ApiClientError,
  fetchRastreioStatus,
} from '@/features/rastreio/lib/rastreio-api';
import {
  formatRastreioHorario,
  RASTREIO_TIMELINE,
  resolveTimelineIndex,
  type RastreioSituacao,
  type RastreioStatus,
} from '@/features/rastreio/types/rastreio.schema';

const POLLING_INTERVAL_MS = 30_000;

function resolveStatusIcon(situacao: RastreioSituacao) {
  switch (situacao) {
    case 'agendado':
      return Clock;
    case 'aguardando':
      return Clock;
    case 'liberado_para_conferencia':
      return Truck;
    case 'em_conferencia':
      return Package;
    case 'conferido':
    case 'finalizado':
      return CheckCircle2;
    case 'cancelado':
      return XCircle;
    default:
      return Clock;
  }
}

function resolveHeroTone(status: RastreioStatus) {
  if (status.situacao === 'cancelado') {
    return {
      border: 'border-error/40',
      bg: 'bg-error-container/15',
      iconBg: 'bg-error-container text-on-error-container',
      accent: 'text-error',
    };
  }

  if (status.finalizado) {
    return {
      border: 'border-primary/40',
      bg: 'bg-primary-container/20',
      iconBg: 'bg-primary text-on-primary',
      accent: 'text-primary',
    };
  }

  if (status.situacao === 'liberado_para_conferencia') {
    return {
      border: 'border-secondary/50',
      bg: 'bg-secondary/10',
      iconBg: 'bg-secondary text-on-secondary',
      accent: 'text-secondary',
    };
  }

  return {
    border: 'border-outline-variant',
    bg: 'bg-surface-container-lowest',
    iconBg: 'bg-surface-container-high text-on-surface',
    accent: 'text-on-background',
  };
}

export function RastreioMotoristaView() {
  const { token } = useParams({ from: '/rastreio/$token' });
  const [status, setStatus] = useState<RastreioStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const carregar = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsRefreshing(true);
      }

      try {
        const result = await fetchRastreioStatus(token);
        setStatus(result);
        setError(null);
        setLastUpdatedAt(new Date());
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : 'Não foi possível carregar o status';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void carregar();
    const intervalId = window.setInterval(() => {
      void carregar({ silent: true });
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [carregar]);

  if (isLoading && !status) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-6">
        <Loader2 className="size-10 animate-spin text-secondary" aria-hidden />
        <div className="space-y-1 text-center">
          <p className="text-base font-medium text-on-background">Carregando status</p>
          <p className="text-sm text-on-surface-variant">Aguarde um instante…</p>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-surface px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-error-container/30">
          <XCircle className="size-8 text-error" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="text-headline-md font-semibold text-on-background">
            Link indisponível
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-on-surface-variant">{error}</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const StatusIcon = resolveStatusIcon(status.situacao);
  const timelineIndex = resolveTimelineIndex(status.situacao);
  const isCancelado = status.situacao === 'cancelado';
  const tone = resolveHeroTone(status);
  const showDocaDestaque =
    status.situacao === 'liberado_para_conferencia' && Boolean(status.docaNome);
  const showAguardandoDoca = status.situacao === 'aguardando';

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-surface">
      <header className="border-b border-outline-variant/60 bg-surface-container-lowest px-5 pb-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              Acompanhamento
            </p>
            <h1 className="font-mono text-headline-xl font-bold tracking-wider text-on-background">
              {status.placa ?? 'Veículo'}
            </h1>
            <p className="truncate text-sm text-on-surface-variant">
              {status.transportadoraNome ?? 'Transportadora'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant bg-surface px-3 py-1.5">
            <Building2 className="size-3.5 text-on-surface-variant" aria-hidden />
            <span className="max-w-[7rem] truncate text-label-sm font-medium text-on-surface">
              {status.unidadeNome}
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-5 py-6">
        <section
          className={cn(
            'overflow-hidden rounded-2xl border shadow-sm',
            tone.border,
            tone.bg,
          )}
        >
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex size-12 shrink-0 items-center justify-center rounded-2xl',
                  tone.iconBg,
                )}
              >
                <StatusIcon className="size-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-label-sm text-on-surface-variant">Instrução atual</p>
                <p className={cn('text-lg font-semibold leading-snug', tone.accent)}>
                  {status.situacaoLabel}
                </p>
                {showAguardandoDoca ? (
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    Você será avisado assim que a doca for definida.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {showDocaDestaque ? (
            <div className="border-t border-secondary/20 bg-secondary/15 px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-on-secondary shadow-sm">
                  <MapPin className="size-7" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-label-sm text-on-surface-variant">Encostar na</p>
                  <p className="truncate text-headline-lg font-bold text-secondary">
                    {status.docaNome}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <div className="mb-2 flex items-center gap-1.5 text-on-surface-variant">
              <Clock className="size-3.5" aria-hidden />
              <p className="text-label-sm">Horário previsto</p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-on-background">
              {formatRastreioHorario(status.horarioPrevisto)}
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <div className="mb-2 flex items-center gap-1.5 text-on-surface-variant">
              <Truck className="size-3.5" aria-hidden />
              <p className="text-label-sm">Chegada</p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-on-background">
              {formatRastreioHorario(status.dataChegada)}
            </p>
          </div>
        </section>

        {!isCancelado ? (
          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
            <p className="mb-5 text-label-sm font-medium uppercase tracking-wider text-on-surface-variant">
              Etapas do processo
            </p>
            <ol className="relative space-y-0">
              {RASTREIO_TIMELINE.map((step, index) => {
                const isDone = index < timelineIndex;
                const isCurrent = index === timelineIndex && !status.finalizado;
                const isLast = index === RASTREIO_TIMELINE.length - 1;

                return (
                  <li key={step.situacao} className="relative flex gap-4 pb-5 last:pb-0">
                    {!isLast ? (
                      <span
                        aria-hidden
                        className={cn(
                          'absolute left-[15px] top-8 h-[calc(100%-12px)] w-0.5 -translate-x-1/2',
                          isDone ? 'bg-secondary' : 'bg-outline-variant/60',
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                        isCurrent
                          ? 'border-secondary bg-secondary text-on-secondary ring-4 ring-secondary/15'
                          : isDone
                            ? 'border-secondary bg-secondary text-on-secondary'
                            : 'border-outline-variant bg-surface text-on-surface-variant',
                      )}
                    >
                      {isDone && !isCurrent ? (
                        <CheckCircle2 className="size-4" aria-hidden />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="min-w-0 pt-1">
                      <p
                        className={cn(
                          'text-sm leading-tight',
                          isCurrent
                            ? 'font-semibold text-on-background'
                            : isDone
                              ? 'font-medium text-on-background'
                              : 'text-on-surface-variant',
                        )}
                      >
                        {step.label}
                      </p>
                      {isCurrent ? (
                        <p className="mt-0.5 text-label-sm text-secondary">Etapa atual</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}
      </main>

      <footer className="mt-auto border-t border-outline-variant/60 bg-surface-container-lowest px-5 py-4">
        {error ? (
          <p className="mb-2 text-center text-xs text-error">{error}</p>
        ) : null}
        <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant">
          <RefreshCw
            className={cn('size-3.5', isRefreshing && 'animate-spin text-secondary')}
            aria-hidden
          />
          <span>
            Atualização automática a cada 30s
            {lastUpdatedAt
              ? ` · ${lastUpdatedAt.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : null}
          </span>
          {!status.finalizado && !isCancelado ? (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary/40 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-secondary" />
            </span>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
