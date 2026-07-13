import { useParams } from '@tanstack/react-router';
import { Button, cn } from '@lilog/ui';
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Truck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { RastreioHistoricoSheet } from '@/features/rastreio/components/rastreio-historico-sheet';
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
      gradient: 'from-error-container/30 via-error-container/10 to-transparent',
      cardBorder: 'border-error/30',
      cardBg: 'bg-gradient-to-br from-error-container/20 to-surface-container-lowest',
      iconBg: 'bg-error text-on-error',
      accent: 'text-error',
      progress: 'bg-error',
      glow: 'shadow-[0_8px_32px_-8px_rgba(var(--error-rgb,220,38,38),0.25)]',
    };
  }

  if (status.finalizado) {
    return {
      gradient: 'from-primary-container/40 via-primary-container/15 to-transparent',
      cardBorder: 'border-primary/25',
      cardBg: 'bg-gradient-to-br from-primary-container/25 to-surface-container-lowest',
      iconBg: 'bg-primary text-on-primary',
      accent: 'text-primary',
      progress: 'bg-primary',
      glow: 'shadow-[0_8px_32px_-8px_rgba(var(--primary-rgb,37,99,235),0.2)]',
    };
  }

  if (status.situacao === 'liberado_para_conferencia') {
    return {
      gradient: 'from-secondary/25 via-secondary/10 to-transparent',
      cardBorder: 'border-secondary/35',
      cardBg: 'bg-gradient-to-br from-secondary/15 to-surface-container-lowest',
      iconBg: 'bg-secondary text-on-secondary',
      accent: 'text-secondary',
      progress: 'bg-secondary',
      glow: 'shadow-[0_8px_32px_-8px_rgba(var(--secondary-rgb,0,150,136),0.25)]',
    };
  }

  return {
    gradient: 'from-surface-container-high/60 via-surface-container-low/30 to-transparent',
    cardBorder: 'border-outline-variant/70',
    cardBg: 'bg-gradient-to-br from-surface-container-low to-surface-container-lowest',
    iconBg: 'bg-surface-container-highest text-on-surface',
    accent: 'text-on-background',
    progress: 'bg-secondary',
    glow: 'shadow-sm',
  };
}

function resolveProgressPercent(timelineIndex: number, finalizado: boolean): number {
  if (finalizado) {
    return 100;
  }

  const total = RASTREIO_TIMELINE.length;
  if (timelineIndex < 0) {
    return 0;
  }

  return Math.round(((timelineIndex + 0.5) / total) * 100);
}

export function RastreioMotoristaView() {
  const { token } = useParams({ from: '/rastreio/$token' });
  const [status, setStatus] = useState<RastreioStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [historicoOpen, setHistoricoOpen] = useState(false);

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
        <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary/10">
          <Loader2 className="size-8 animate-spin text-secondary" aria-hidden />
        </div>
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
        <div className="flex size-16 items-center justify-center rounded-2xl bg-error-container/30">
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
  const progressPercent = resolveProgressPercent(timelineIndex, status.finalizado);
  const currentStep =
    timelineIndex >= 0 ? timelineIndex + 1 : 0;
  const totalSteps = RASTREIO_TIMELINE.length;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-surface">
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b',
          tone.gradient,
        )}
      />

      <header className="relative z-10 px-5 pb-2 pt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-label-sm font-medium uppercase tracking-[0.14em] text-on-surface-variant">
            Acompanhamento
          </p>
          <div className="flex items-center gap-2">
            {!isCancelado ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-xl border-outline-variant/80 bg-surface/80 backdrop-blur-sm"
                aria-label="Ver histórico do processo"
                onClick={() => setHistoricoOpen(true)}
              >
                <History className="size-5 text-on-surface" aria-hidden />
              </Button>
            ) : null}
            <div className="flex items-center gap-1.5 rounded-full border border-outline-variant/80 bg-surface/80 px-3 py-1.5 backdrop-blur-sm">
              <Building2 className="size-3.5 text-on-surface-variant" aria-hidden />
              <span className="max-w-[7rem] truncate text-label-sm font-medium text-on-surface">
                {status.unidadeNome}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-surface-container-high/80 text-on-surface backdrop-blur-sm">
              <Truck className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h1 className="font-mono text-headline-xl font-bold tracking-wider text-on-background">
                {status.placa ?? 'Veículo'}
              </h1>
              <p className="truncate text-sm text-on-surface-variant">
                {status.transportadoraNome ?? 'Transportadora'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col gap-5 px-5 py-5">
        <section
          className={cn(
            'overflow-hidden rounded-3xl border',
            tone.cardBorder,
            tone.cardBg,
            tone.glow,
          )}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                  tone.iconBg,
                )}
              >
                <StatusIcon className="size-7" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-label-sm font-medium uppercase tracking-wider text-on-surface-variant">
                  Instrução atual
                </p>
                <p className={cn('text-xl font-semibold leading-snug', tone.accent)}>
                  {status.situacaoLabel}
                </p>
                {showAguardandoDoca ? (
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    Você será avisado assim que a doca for definida.
                  </p>
                ) : null}
              </div>
            </div>

            {!isCancelado ? (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-label-sm">
                  <span className="font-medium text-on-surface-variant">Progresso</span>
                  <button
                    type="button"
                    onClick={() => setHistoricoOpen(true)}
                    className="font-medium text-secondary underline-offset-2 hover:underline"
                  >
                    Etapa {currentStep} de {totalSteps}
                  </button>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-outline-variant/30">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', tone.progress)}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {showDocaDestaque ? (
            <div className="border-t border-secondary/20 bg-secondary/12 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-on-secondary shadow-md">
                  <MapPin className="size-8" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-label-sm font-medium uppercase tracking-wider text-on-surface-variant">
                    Encostar na
                  </p>
                  <p className="truncate text-headline-lg font-bold text-secondary">
                    {status.docaNome}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest/90 p-4 backdrop-blur-sm">
            <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary-container/30 text-primary">
              <CalendarClock className="size-4" aria-hidden />
            </div>
            <p className="text-label-sm text-on-surface-variant">Horário previsto</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-on-background">
              {formatRastreioHorario(status.horarioPrevisto)}
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest/90 p-4 backdrop-blur-sm">
            <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <Truck className="size-4" aria-hidden />
            </div>
            <p className="text-label-sm text-on-surface-variant">Chegada</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-on-background">
              {formatRastreioHorario(status.dataChegada)}
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto border-t border-outline-variant/50 bg-surface-container-lowest/80 px-5 py-4 backdrop-blur-sm">
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

      {!isCancelado ? (
        <RastreioHistoricoSheet
          open={historicoOpen}
          onOpenChange={setHistoricoOpen}
          status={status}
        />
      ) : null}
    </div>
  );
}
