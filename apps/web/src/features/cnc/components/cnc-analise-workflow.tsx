'use client';

import { cn } from '@lilog/ui';
import {
  Check,
  CircleDot,
  FileSearch,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react';

import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import { formatCncDate } from '@/features/cnc/lib/cnc-detalhe-utils';

type CncAnaliseWorkflowProps = {
  cnc: CncDetalhe;
  className?: string;
};

type StepState = 'done' | 'current' | 'upcoming' | 'skipped';

type WorkflowStep = {
  id: string;
  label: string;
  icon: typeof FileSearch;
  state: StepState;
  meta?: string;
};

function resolveSteps(cnc: CncDetalhe): WorkflowStep[] {
  const temObservacao = Boolean(cnc.observacao?.trim());
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

  const observacaoState: StepState = cancelada
    ? 'skipped'
    : encerrada
      ? temObservacao
        ? 'done'
        : 'skipped'
      : emAnalise
        ? temObservacao
          ? 'done'
          : 'current'
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
      icon: CircleDot,
      state: aberturaState,
      meta: formatCncDate(cnc.createdAt),
    },
    {
      id: 'analise',
      label: 'Análise',
      icon: FileSearch,
      state: analiseState,
      meta: cnc.iniciadoEm ? formatCncDate(cnc.iniciadoEm) : undefined,
    },
    {
      id: 'observacao',
      label: 'Observação',
      icon: MessageSquareText,
      state: observacaoState,
      meta: temObservacao ? 'Registrada' : undefined,
    },
    {
      id: 'encerramento',
      label: encerrada ? 'Encerrada' : cancelada ? 'Cancelada' : 'Encerramento',
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
      return 'border-primary bg-primary/15 text-primary ring-2 ring-primary/20';
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
        'rounded-lg border border-outline-variant/50 bg-glass-bg px-2 py-1.5 shadow-inner-glow backdrop-blur-glass sm:px-3 sm:py-2',
        className,
      )}
    >
      <ol className="flex flex-nowrap items-center gap-1 overflow-x-auto sm:gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn(
                'flex min-w-0 flex-1 items-center gap-1.5',
                !isLast && 'shrink-0',
              )}
            >
              <div
                className={cn(
                  'flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:size-5',
                  stepCircleClass(step.state),
                )}
              >
                {step.state === 'done' ? (
                  <Check className="size-2 sm:size-2.5" aria-hidden />
                ) : (
                  <Icon className="size-2 sm:size-2.5" aria-hidden />
                )}
              </div>

              <p className="min-w-0 truncate whitespace-nowrap text-[10px] leading-none sm:text-[11px]">
                <span
                  className={cn(
                    'font-semibold',
                    step.state === 'current'
                      ? 'text-primary'
                      : step.state === 'done'
                        ? 'text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
                {step.meta ? (
                  <>
                    <span className="mx-1 text-muted-foreground/40" aria-hidden>
                      ·
                    </span>
                    <span className="font-normal text-muted-foreground">
                      {step.meta}
                    </span>
                  </>
                ) : null}
              </p>

              {!isLast ? (
                <span
                  className="mx-0.5 hidden h-px min-w-2 flex-1 bg-outline-variant sm:block"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
