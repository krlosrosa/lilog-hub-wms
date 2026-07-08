'use client';

import { cn } from '@lilog/ui';
import {
  Check,
  CircleDot,
  ClipboardCheck,
  FileSearch,
  ShieldCheck,
} from 'lucide-react';

import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import {
  calcularProgressoTratativas,
  formatCncDate,
} from '@/features/cnc/lib/cnc-detalhe-utils';

type CncAnaliseWorkflowProps = {
  cnc: CncDetalhe;
  className?: string;
};

type StepState = 'done' | 'current' | 'upcoming' | 'skipped';

type WorkflowStep = {
  id: string;
  label: string;
  description: string;
  icon: typeof FileSearch;
  state: StepState;
  meta?: string;
};

function resolveSteps(cnc: CncDetalhe): WorkflowStep[] {
  const progressoTratativas = calcularProgressoTratativas(cnc);
  const cancelada = cnc.situacao === 'cancelada';
  const encerrada = cnc.situacao === 'encerrada';
  const emAnalise = cnc.situacao === 'em_analise';
  const pendente = cnc.situacao === 'pendente';

  const aberturaState: StepState = 'done';
  const analiseState: StepState = cancelada
    ? 'skipped'
    : encerrada || emAnalise
      ? emAnalise
        ? 'current'
        : 'done'
      : pendente
        ? 'current'
        : 'upcoming';

  const tratativasState: StepState = cancelada
    ? 'skipped'
    : encerrada
      ? progressoTratativas.total > 0
        ? 'done'
        : 'skipped'
      : emAnalise
        ? progressoTratativas.total > 0
          ? progressoTratativas.pendentes > 0
            ? 'current'
            : 'done'
          : 'upcoming'
        : 'upcoming';

  const encerramentoState: StepState = cancelada
    ? 'skipped'
    : encerrada
      ? 'done'
      : 'upcoming';

  return [
    {
      id: 'abertura',
      label: 'Abertura',
      description: 'CNC registrada a partir do recebimento',
      icon: CircleDot,
      state: aberturaState,
      meta: formatCncDate(cnc.createdAt),
    },
    {
      id: 'analise',
      label: 'Análise',
      description: 'Investigação das anomalias identificadas',
      icon: FileSearch,
      state: analiseState,
      meta: cnc.iniciadoEm ? formatCncDate(cnc.iniciadoEm) : undefined,
    },
    {
      id: 'tratativas',
      label: 'Tratativas',
      description: 'Ações imediatas, corretivas e preventivas',
      icon: ClipboardCheck,
      state: tratativasState,
      meta:
        progressoTratativas.total > 0
          ? `${progressoTratativas.concluidas}/${progressoTratativas.total} concluídas`
          : undefined,
    },
    {
      id: 'encerramento',
      label: encerrada ? 'Encerrada' : cancelada ? 'Cancelada' : 'Encerramento',
      description: encerrada
        ? 'Não conformidade finalizada'
        : cancelada
          ? 'Processo interrompido'
          : 'Conclusão com responsável e débito',
      icon: ShieldCheck,
      state: encerramentoState,
      meta: encerrada
        ? formatCncDate(cnc.encerradoEm)
        : cancelada
          ? 'Cancelada'
          : undefined,
    },
  ];
}

function stepCircleClass(state: StepState) {
  switch (state) {
    case 'done':
      return 'border-primary bg-primary text-primary-foreground';
    case 'current':
      return 'border-primary bg-primary/15 text-primary ring-4 ring-primary/20';
    case 'skipped':
      return 'border-muted-foreground/30 bg-muted/30 text-muted-foreground';
    default:
      return 'border-outline-variant bg-surface-low text-muted-foreground';
  }
}

export function CncAnaliseWorkflow({ cnc, className }: CncAnaliseWorkflowProps) {
  const steps = resolveSteps(cnc);

  return (
    <nav
      aria-label="Fluxo de análise da CNC"
      className={cn(
        'rounded-xl border border-outline-variant/50 bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass',
        className,
      )}
    >
      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="relative flex gap-3">
              {!isLast ? (
                <span
                  className="absolute left-[15px] top-9 hidden h-[calc(100%-12px)] w-px bg-outline-variant xl:block"
                  aria-hidden
                />
              ) : null}

              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  stepCircleClass(step.state),
                )}
              >
                {step.state === 'done' ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  <Icon className="size-3.5" aria-hidden />
                )}
              </div>

              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    'text-xs font-semibold',
                    step.state === 'current'
                      ? 'text-primary'
                      : step.state === 'done'
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {step.description}
                </p>
                {step.meta ? (
                  <p className="mt-1 text-[10px] font-medium text-foreground/80">
                    {step.meta}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
