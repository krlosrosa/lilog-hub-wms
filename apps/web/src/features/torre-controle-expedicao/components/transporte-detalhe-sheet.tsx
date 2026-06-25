'use client';

import type { ReactNode } from 'react';

import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Navigation,
  Package,
  Truck,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Sheet,
  SheetContent,
  SheetFooter,
  cn,
} from '@lilog/ui';

import { PrioridadeTransporteBadge } from '@/features/transporte/components/prioridade-transporte-badge';
import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import { EtapaStatusBadge } from '@/features/torre-controle-expedicao/components/etapa-status-badge';
import { ProcessoStatusBadge } from '@/features/torre-controle-expedicao/components/processo-status-badge';
import { RiscoBadge } from '@/features/torre-controle-expedicao/components/risco-badge';
import { BadgeAtrasoExpedicao } from '@/features/torre-controle-expedicao/components/tempo-restante-expedicao';
import {
  formatarDuracaoSegundos,
  formatarLinhaHorarioProcesso,
  metaLargadaClassName,
  resolverTempoRestanteExpedicaoSeg,
} from '@/features/torre-controle-expedicao/lib/formatar-tempo';
import { montarPipelineDetalheTransporte, isEtapaHorario } from '@/features/torre-controle-expedicao/lib/resolver-pipeline-viagem';
import type {
  MapaResumo,
  ProcessoStatus,
  TransporteRisco,
} from '@/features/torre-controle-expedicao/types/torre-controle.schema';
import { ETAPA_OPERACIONAL_LABELS } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const ESTILO_ETAPA_PENDENTE = {
  dot: 'bg-muted-foreground/30 border-muted-foreground/40',
  ring: 'ring-muted-foreground/20',
  line: 'bg-outline-variant',
} as const;

const ESTILO_ETAPA_CONCLUIDO = {
  dot: 'bg-primary border-primary ring-primary/30',
  ring: 'ring-primary/25',
  line: 'bg-primary/40',
} as const;

const PROCESSO_STEP_STYLES: Record<
  ProcessoStatus,
  { dot: string; ring: string; line: string }
> = {
  pendente: ESTILO_ETAPA_PENDENTE,
  em_andamento: {
    dot: 'bg-warning border-warning ring-warning/30',
    ring: 'ring-warning/25',
    line: 'bg-warning/40',
  },
  concluido: ESTILO_ETAPA_CONCLUIDO,
};

function obterEstiloEtapa(status?: ProcessoStatus) {
  return PROCESSO_STEP_STYLES[status ?? 'pendente'] ?? ESTILO_ETAPA_PENDENTE;
}

function headerAccentClass(transporte: TransporteRisco): string {
  if (transporte.etapaAtual === 'finalizado') {
    return 'from-primary/20 via-primary/5 to-background border-primary/20';
  }

  switch (transporte.nivelRisco) {
    case 'critico':
      return 'from-destructive/20 via-destructive/5 to-background border-destructive/25';
    case 'alto':
      return 'from-tertiary/20 via-tertiary/5 to-background border-tertiary/25';
    case 'medio':
      return 'from-warning/15 via-warning/5 to-background border-warning/20';
    default:
      return 'from-primary/10 via-surface-high/40 to-background border-outline-variant';
  }
}

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: string;
};

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-outline-variant bg-surface-low/80 p-3',
        accent,
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-body-md font-semibold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}

export type TransporteDetalheSheetProps = {
  open: boolean;
  transporte: TransporteRisco | null;
  mapas: MapaResumo[];
  onOpenChange: (open: boolean) => void;
  onVerDoca?: (docaId: string) => void;
  docas: { id: string; label: string }[];
};

export function TransporteDetalheSheet({
  open,
  transporte,
  mapas,
  onOpenChange,
  onVerDoca,
  docas,
}: TransporteDetalheSheetProps) {
  if (!transporte) {
    return null;
  }

  const finalizado = transporte.etapaAtual === 'finalizado';
  const doca = docas.find((d) => d.label === transporte.docaAlocada);
  const mapasConcluidosListagem = mapas.filter(
    (mapa) => mapa.status === 'concluido',
  ).length;
  const mapasTotalListagem = mapas.length;
  const progressoMapas =
    mapasTotalListagem > 0
      ? Math.round((mapasConcluidosListagem / mapasTotalListagem) * 100)
      : transporte.mapasTotal > 0
        ? Math.round((transporte.mapasConcluidos / transporte.mapasTotal) * 100)
        : 0;
  const tempoEstimadoFinalizarSeg =
    transporte.tempoEstimadoFinalizarSeg ??
    transporte.tempoEstimadoFinalizarMin * 60;
  const tempoRestanteExpedicaoSeg = resolverTempoRestanteExpedicaoSeg(
    transporte.tempoRestanteSaidaMin,
    transporte.tempoRestanteSaidaSeg,
  );
  const deficitSeg = tempoEstimadoFinalizarSeg - tempoRestanteExpedicaoSeg;
  const pipelineEtapas = montarPipelineDetalheTransporte(transporte);

  const handleMockAction = (action: string) => {
    toast.success(`${action} simulado`, {
      description: `Ação registrada para ${transporte.codigo} (mock).`,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div
          className={cn(
            'shrink-0 border-b bg-gradient-to-b px-6 pb-5 pt-6',
            headerAccentClass(transporte),
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-outline-variant/60 bg-background/80 shadow-sm">
              <Truck className="size-5 text-primary" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-title-md font-bold tracking-tight text-foreground">
                  {transporte.codigo}
                </h2>
                <EtapaStatusBadge etapa={transporte.etapaAtual} />
              </div>
              <p className="mt-0.5 text-caption text-muted-foreground">
                {transporte.placa} · {transporte.transportadora}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {transporte.isPrioridade && transporte.nivelPrioridade ? (
                  <PrioridadeTransporteBadge nivel={transporte.nivelPrioridade} />
                ) : transporte.prioridade ? (
                  <span className="inline-flex rounded-full bg-secondary/15 px-2 py-0.5 text-[10px] font-semibold text-secondary ring-1 ring-inset ring-secondary/20">
                    Reentrega
                  </span>
                ) : null}
                {finalizado ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    <CheckCircle2 className="size-3" aria-hidden />
                    Concluído
                  </span>
                ) : (
                  <RiscoBadge nivel={transporte.nivelRisco} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard
              label="Meta de largada"
              icon={<Clock className="size-3.5" aria-hidden />}
              value={
                <span className={metaLargadaClassName}>{transporte.horarioSaida}</span>
              }
            />
            <StatCard
              label="Atraso"
              icon={<AlertTriangle className="size-3.5" aria-hidden />}
              value={
                <BadgeAtrasoExpedicao
                  tempoRestanteSaidaMin={transporte.tempoRestanteSaidaMin}
                  tempoRestanteSaidaSeg={transporte.tempoRestanteSaidaSeg}
                />
              }
            />
            <StatCard
              label="Tempo previsto de processo"
              icon={<Package className="size-3.5" aria-hidden />}
              value={formatarDuracaoSegundos(tempoEstimadoFinalizarSeg)}
            />
            <StatCard
              label="Mapas"
              icon={<CheckCircle2 className="size-3.5" aria-hidden />}
              value={
                mapasTotalListagem > 0
                  ? `${mapasConcluidosListagem}/${mapasTotalListagem}`
                  : `${transporte.mapasConcluidos}/${transporte.mapasTotal}`
              }
              accent={
                progressoMapas === 100 ? 'border-primary/30 bg-primary/5' : undefined
              }
            />
          </div>

          {!finalizado && deficitSeg > 0 ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden
              />
              <div>
                <p className="text-caption font-semibold text-destructive">
                  Risco de não cumprir a meta
                </p>
                <p className="text-[11px] text-muted-foreground">
                  O tempo previsto de processo excede o tempo restante em{' '}
                  <span className="font-medium tabular-nums text-foreground">
                    {formatarDuracaoSegundos(deficitSeg)}
                  </span>
                  .
                </p>
              </div>
            </div>
          ) : null}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-label-md font-semibold text-foreground">
                Pipeline operacional
              </h3>
              <span className="text-[10px] text-muted-foreground">
                {ETAPA_OPERACIONAL_LABELS[transporte.etapaAtual]}
              </span>
            </div>

            {transporte.viagemId != null ? (
              <div
                className={cn(
                  glassPanelClassName,
                  'flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-[11px]',
                  transporte.anomalia && 'border-destructive/30 bg-destructive/[0.03]',
                )}
              >
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Navigation className="size-3.5 text-accent" aria-hidden />
                  Viagem Ravex
                </span>
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  #{transporte.viagemId}
                </span>
                {transporte.anomalia ? (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertTriangle className="size-3" aria-hidden />
                    {transporte.anomalia}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className={cn(glassPanelClassName, 'overflow-x-auto p-4')}>
              <div className="relative flex min-w-[640px] items-start justify-between gap-1">
                {pipelineEtapas.map((etapa, index) => {
                  const isLast = index === pipelineEtapas.length - 1;

                  if (isEtapaHorario(etapa)) {
                    const styles = etapa.horario
                      ? ESTILO_ETAPA_CONCLUIDO
                      : ESTILO_ETAPA_PENDENTE;

                    return (
                      <div key={etapa.key} className="relative flex flex-1 flex-col items-center">
                        {!isLast ? (
                          <div
                            className={cn(
                              'absolute left-[calc(50%+14px)] top-3 h-0.5 w-[calc(100%-28px)]',
                              styles.line,
                            )}
                            aria-hidden
                          />
                        ) : null}
                        <div
                          className={cn(
                            'relative z-10 flex size-6 items-center justify-center rounded-full border-2 ring-2',
                            styles.dot,
                            styles.ring,
                          )}
                        >
                          {etapa.horario ? (
                            <CheckCircle2 className="size-3 text-background" />
                          ) : null}
                        </div>
                        <p className="mt-2 text-center text-[10px] font-medium leading-tight text-foreground">
                          {etapa.label}
                        </p>
                        <p className="mt-3 max-w-[6.5rem] text-center text-[10px] font-semibold leading-snug tabular-nums text-foreground whitespace-normal break-words">
                          {etapa.horario ?? '—'}
                        </p>
                      </div>
                    );
                  }

                  const styles = obterEstiloEtapa(etapa.status);

                  return (
                    <div key={etapa.key} className="relative flex flex-1 flex-col items-center">
                      {!isLast ? (
                        <div
                          className={cn(
                            'absolute left-[calc(50%+14px)] top-3 h-0.5 w-[calc(100%-28px)]',
                            styles.line,
                          )}
                          aria-hidden
                        />
                      ) : null}
                      <div
                        className={cn(
                          'relative z-10 flex size-6 items-center justify-center rounded-full border-2 ring-2',
                          styles.dot,
                          styles.ring,
                        )}
                      >
                        {etapa.status === 'concluido' ? (
                          <CheckCircle2 className="size-3 text-background" />
                        ) : etapa.status === 'em_andamento' ? (
                          <span className="size-2 animate-pulse rounded-full bg-background" />
                        ) : null}
                      </div>
                      <p className="mt-2 text-center text-[10px] font-medium leading-tight text-foreground">
                        {etapa.label}
                      </p>
                      <div className="mt-1.5">
                        <ProcessoStatusBadge status={etapa.status} horario={etapa.horario} />
                      </div>
                      <div className="mt-2 w-full space-y-0.5 text-center text-[9px] leading-snug tabular-nums text-muted-foreground">
                        <p className="whitespace-normal break-words">
                          {formatarLinhaHorarioProcesso(etapa.horario.inicio, 'Início')}
                        </p>
                        <p className="whitespace-normal break-words">
                          {formatarLinhaHorarioProcesso(etapa.horario.fim, 'Fim')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-label-md font-semibold text-foreground">
                Progresso dos mapas
              </h3>
              <span className="text-caption font-semibold tabular-nums text-primary">
                {progressoMapas}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  progressoMapas === 100 ? 'bg-primary' : 'bg-primary/80',
                )}
                style={{ width: `${progressoMapas}%` }}
              />
            </div>
            {mapasTotalListagem > 0 || transporte.mapasTotal > 0 ? (
              <p className="text-[11px] text-muted-foreground">
                {mapasTotalListagem > 0
                  ? `${mapasConcluidosListagem} de ${mapasTotalListagem} mapas concluídos`
                  : `${transporte.mapasConcluidos} de ${transporte.mapasTotal} mapas concluídos`}
                {transporte.pesoTotalKg > 0
                  ? ` · ${transporte.pesoTotalKg.toLocaleString('pt-BR')} kg`
                  : null}
              </p>
            ) : null}
          </section>

          {transporte.docaAlocada ? (
            <section
              className={cn(
                glassPanelClassName,
                'flex items-center justify-between gap-3 p-4',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent/10">
                  <MapPin className="size-4 text-accent" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Doca alocada
                  </p>
                  <p className="text-body-md font-bold text-foreground">
                    {transporte.docaAlocada}
                  </p>
                </div>
              </div>
              {doca && onVerDoca ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => onVerDoca(doca.id)}
                >
                  Ver doca
                </Button>
              ) : null}
            </section>
          ) : null}

          {transporte.lacreCarregamento ? (
            <StatCard
              label="Lacre"
              icon={<Lock className="size-3.5" aria-hidden />}
              value={transporte.lacreCarregamento}
            />
          ) : null}

          <section className="space-y-2.5">
            <h3 className="text-label-md font-semibold text-foreground">
              Mapas do transporte
              <span className="ml-1.5 text-caption font-normal text-muted-foreground">
                ({mapas.length})
              </span>
            </h3>

            {mapas.length === 0 ? (
              <div
                className={cn(
                  glassPanelClassName,
                  'px-4 py-8 text-center text-caption text-muted-foreground',
                )}
              >
                Nenhum mapa detalhado disponível para este transporte.
              </div>
            ) : (
              <ul className="space-y-2">
                {mapas.map((mapa) => (
                  <li
                    key={mapa.id}
                    className={cn(
                      glassPanelClassName,
                      'flex items-center gap-3 px-3 py-2.5',
                      mapa.prioridade && 'border-destructive/25 bg-destructive/[0.03]',
                    )}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-high">
                      <Package className="size-3.5 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-mono text-caption font-semibold text-foreground">
                          {mapa.codigo}
                        </span>
                        <EtapaStatusBadge etapa={mapa.etapa} />
                        <ProcessoStatusBadge
                          status={mapa.status}
                          horario={{
                            inicio: mapa.horarioInicio,
                            fim: mapa.horarioFim,
                          }}
                        />
                        {mapa.prioridade ? (
                          <span className="rounded bg-destructive/10 px-1 py-px text-[8px] font-bold uppercase text-destructive">
                            Prioritário
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                        {mapa.status !== 'concluido' ? (
                          <span className="tabular-nums">
                            Parado{' '}
                            {formatarDuracaoSegundos(
                              mapa.tempoParadoSeg ?? mapa.tempoParadoMin * 60,
                            )}
                          </span>
                        ) : null}
                        <span className="tabular-nums">
                          {formatarLinhaHorarioProcesso(mapa.horarioInicio, 'Início')}
                        </span>
                        <span className="tabular-nums">
                          {formatarLinhaHorarioProcesso(mapa.horarioFim, 'Fim')}
                        </span>
                        {mapa.operador ? (
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="size-2.5" aria-hidden />
                            {mapa.operador}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <SheetFooter className="shrink-0 gap-2 border-t border-outline-variant bg-surface-high/30 px-6 py-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => handleMockAction('Realocar doca')}
          >
            <ArrowRightLeft className="size-4" aria-hidden />
            Realocar doca
          </Button>
          <Button
            type="button"
            className="flex-1 gap-2"
            onClick={() => handleMockAction('Escalar supervisor')}
          >
            <AlertTriangle className="size-4" aria-hidden />
            Escalar supervisor
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
