import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { cn } from '@lilog/ui';
import {
  Check,
  Circle,
  Clock,
  Dock,
  Hourglass,
  Minus,
  ShieldAlert,
  Timer,
  Truck,
  X,
} from 'lucide-react';

import { PrioridadeBadge } from '@/features/indicadores/components/prioridade-badge';
import { RiscoBadge } from '@/features/indicadores/components/risco-badge';
import {
  classificarStatusMeta,
  formatarCountdownSaida,
  formatarIntervaloHorarioProcesso,
  formatarMinutos,
} from '@/features/indicadores/lib/formatar-tempo';
import type {
  HorarioProcesso,
  MapaResumo,
  NivelRisco,
  ProcessoStatus,
  TransporteRisco,
} from '@/features/indicadores/lib/torre-controle.schema';
import { ETAPA_OPERACIONAL_LABELS } from '@/features/indicadores/lib/torre-controle.schema';

type TransporteDetalheSheetProps = {
  open: boolean;
  transporte: TransporteRisco | null;
  mapas: MapaResumo[];
  onOpenChange: (open: boolean) => void;
};

const RISCO_ACCENT: Record<NivelRisco, string> = {
  critico: 'from-destructive/10',
  alto: 'from-warning/10',
  medio: 'from-secondary/8',
  baixo: 'from-surface-container',
};

const PROCESSO_NODE: Record<
  ProcessoStatus,
  { ring: string; fill: string; icon: 'check' | 'dot' | 'minus' }
> = {
  pendente: {
    ring: 'border-outline-variant bg-surface-container',
    fill: 'text-on-surface-variant',
    icon: 'minus',
  },
  em_andamento: {
    ring: 'border-primary bg-primary/10',
    fill: 'text-primary',
    icon: 'dot',
  },
  concluido: {
    ring: 'border-tertiary bg-tertiary-container',
    fill: 'text-tertiary',
    icon: 'check',
  },
};

function ProcessoNodeIcon({ status }: { status: ProcessoStatus }) {
  const config = PROCESSO_NODE[status];

  if (config.icon === 'check') {
    return <Check className={cn('h-3 w-3 stroke-[2.5]', config.fill)} aria-hidden />;
  }

  if (config.icon === 'dot') {
    return <Circle className={cn('h-1.5 w-1.5 fill-current', config.fill)} aria-hidden />;
  }

  return <Minus className={cn('h-2.5 w-2.5', config.fill)} aria-hidden />;
}

function ProcessoStep({
  label,
  status,
  horario,
  isCurrent,
  showConnector,
}: {
  label: string;
  status: ProcessoStatus;
  horario: HorarioProcesso;
  isCurrent: boolean;
  showConnector: boolean;
}) {
  const node = PROCESSO_NODE[status];

  return (
    <div className="relative flex min-w-0 flex-1 flex-col items-center">
      {showConnector ? (
        <span
          className="absolute left-[calc(50%+12px)] top-[10px] h-px w-[calc(100%-24px)] bg-outline-variant/70"
          aria-hidden
        />
      ) : null}

      <div
        className={cn(
          'relative z-10 flex h-6 w-6 items-center justify-center rounded-full border',
          node.ring,
          isCurrent && 'ring-2 ring-primary/20 ring-offset-2 ring-offset-surface-container-low',
        )}
      >
        <ProcessoNodeIcon status={status} />
      </div>

      <p className="mt-1.5 max-w-[88px] truncate text-center text-[11px] font-semibold text-on-surface">
        {label}
      </p>
      <p className="mt-0.5 max-w-[96px] truncate text-center text-[10px] tabular-nums text-on-surface-variant">
        {formatarIntervaloHorarioProcesso(horario, status)}
      </p>
    </div>
  );
}

export function TransporteDetalheSheet({
  open,
  transporte,
  mapas,
  onOpenChange,
}: TransporteDetalheSheetProps) {
  if (!transporte) {
    return null;
  }

  const statusMeta = classificarStatusMeta(transporte.tempoRestanteSaidaMin);
  const progressoMapas =
    transporte.mapasTotal > 0
      ? Math.round((transporte.mapasConcluidos / transporte.mapasTotal) * 100)
      : 0;

  const processos = [
    { key: 'separacao' as const, label: 'Separação' },
    { key: 'conferencia' as const, label: 'Conferência' },
    { key: 'carregamento' as const, label: 'Carregamento' },
  ];

  const metricas = [
    {
      label: 'Saída',
      value: transporte.horarioSaida,
      icon: Clock,
      accent: 'default' as const,
    },
    {
      label: 'Restante',
      value: formatarCountdownSaida(transporte.tempoRestanteSaidaMin),
      icon: Timer,
      accent:
        statusMeta === 'atrasado'
          ? ('danger' as const)
          : statusMeta === 'risco_atraso'
            ? ('warning' as const)
            : ('default' as const),
    },
    {
      label: 'Estimado',
      value: formatarMinutos(transporte.tempoEstimadoFinalizarMin),
      icon: Hourglass,
      accent: 'default' as const,
    },
    {
      label: 'Risco',
      value: transporte.nivelRisco.charAt(0).toUpperCase() + transporte.nivelRisco.slice(1),
      icon: ShieldAlert,
      accent:
        transporte.nivelRisco === 'critico'
          ? ('danger' as const)
          : transporte.nivelRisco === 'alto'
            ? ('warning' as const)
            : ('default' as const),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          'inset-x-0 bottom-0 flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden rounded-t-[1.25rem] border-t-0 bg-surface-container-low p-0',
          '[&>button]:hidden',
        )}
      >
        <div className="relative shrink-0 px-4 pb-3 pt-1">
          <div className="relative mb-2 flex h-9 items-center justify-center">
            <div className="h-1 w-10 rounded-full bg-outline-variant/60" aria-hidden />
            <SheetClose
              className="absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-on-surface-variant shadow-md touch-manipulation active:scale-95"
              aria-label="Fechar detalhes do transporte"
            >
              <X className="h-4 w-4" aria-hidden />
            </SheetClose>
          </div>

          <div
            className={cn(
              'rounded-xl bg-gradient-to-br to-surface-container-low p-3',
              RISCO_ACCENT[transporte.nivelRisco],
            )}
          >
            <SheetHeader className="space-y-0 p-0 text-left">
              <div className="flex items-start gap-3 pr-10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface shadow-sm">
                  <Truck className="h-4 w-4 text-secondary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-headline-md font-bold leading-tight text-on-surface">
                    {transporte.codigo}
                  </SheetTitle>
                  <SheetDescription asChild>
                    <p className="truncate text-label-sm text-on-surface-variant">
                      {transporte.placa} · {transporte.transportadora}
                    </p>
                  </SheetDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <RiscoBadge nivel={transporte.nivelRisco} />
                    {transporte.isPrioridade && transporte.nivelPrioridade ? (
                      <PrioridadeBadge nivel={transporte.nivelPrioridade} />
                    ) : transporte.prioridade ? (
                      <span className="inline-flex rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                        Reentrega
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-3 rounded-lg bg-surface px-3 py-2.5 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between text-label-sm">
                <span className="text-on-surface-variant">
                  Mapas · {ETAPA_OPERACIONAL_LABELS[transporte.etapaAtual]}
                </span>
                <span className="font-bold tabular-nums text-on-surface">
                  {transporte.mapasConcluidos}/{transporte.mapasTotal}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-secondary"
                  style={{ width: `${progressoMapas}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-1">
          <div className="grid grid-cols-4 gap-2">
            {metricas.map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className="rounded-xl bg-surface px-2 py-2.5 text-center shadow-sm"
              >
                <Icon className="mx-auto h-3.5 w-3.5 text-secondary" aria-hidden />
                <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">
                  {label}
                </p>
                <p
                  className={cn(
                    'mt-0.5 truncate font-mono text-label-sm font-bold tabular-nums',
                    accent === 'danger'
                      ? 'text-destructive'
                      : accent === 'warning'
                        ? 'text-warning'
                        : 'text-on-surface',
                  )}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          <section className="rounded-xl bg-surface px-3 py-3 shadow-sm">
            <p className="mb-3 text-label-sm font-semibold text-on-surface-variant">
              Processos
            </p>
            <div className="flex gap-0.5">
              {processos.map(({ key, label }, index) => (
                <ProcessoStep
                  key={key}
                  label={label}
                  status={transporte.statusProcessos[key]}
                  horario={transporte.horariosProcessos[key]}
                  isCurrent={transporte.etapaAtual === key}
                  showConnector={index < processos.length - 1}
                />
              ))}
            </div>
          </section>

          {transporte.docaAlocada ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 shadow-sm">
              <Dock className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase text-on-surface-variant">Doca</p>
                <p className="truncate text-label-sm font-semibold text-on-surface">
                  {transporte.docaAlocada}
                </p>
              </div>
            </div>
          ) : null}

          <section>
            <p className="mb-2 text-label-sm font-semibold text-on-surface-variant">
              Mapas ({mapas.length})
            </p>
            {mapas.length === 0 ? (
              <p className="rounded-xl bg-surface px-3 py-4 text-center text-label-sm text-on-surface-variant shadow-sm">
                Nenhum mapa detalhado disponível.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-xl bg-surface shadow-sm">
                {mapas.map((mapa) => (
                  <li
                    key={mapa.id}
                    className="flex items-center justify-between gap-2 border-b border-outline-variant/30 px-3 py-2 last:border-b-0"
                  >
                    <span className="min-w-0 truncate text-label-sm font-medium text-on-surface">
                      {mapa.codigo}
                    </span>
                    <span className="shrink-0 text-[11px] text-on-surface-variant">
                      {ETAPA_OPERACIONAL_LABELS[mapa.etapa]} ·{' '}
                      <span
                        className={cn(
                          'font-semibold tabular-nums',
                          mapa.tempoParadoMin >= 30
                            ? 'text-destructive'
                            : mapa.tempoParadoMin >= 15
                              ? 'text-warning'
                              : '',
                        )}
                      >
                        {mapa.tempoParadoMin}m
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="shrink-0 px-4 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
          <SheetClose className="flex h-11 w-full items-center justify-center rounded-xl bg-surface text-label-md font-semibold text-on-surface shadow-sm touch-manipulation active:scale-[0.99]">
            Fechar
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
