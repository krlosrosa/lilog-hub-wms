import { cn } from '@lilog/ui';
import { CheckCircle, Loader2 } from 'lucide-react';

import type { BootstrapProgress, BootstrapStep } from '@/features/recebimento-v2/types/recebimento-v2.schema';

const STEP_LABELS: Record<BootstrapStep, string> = {
  session: 'Validar sessão',
  catalog: 'Catálogo de produtos',
  'reference-data': 'Dados de referência',
  package: 'Pacote da demanda',
  snapshot: 'Conferências e avarias',
  media: 'Mídias',
  done: 'Concluído',
};

function stepIndex(step: BootstrapStep): number {
  const order: BootstrapStep[] = [
    'session',
    'catalog',
    'reference-data',
    'package',
    'snapshot',
    'media',
    'done',
  ];
  return order.indexOf(step);
}

export function OfflineBootstrapProgress({
  progress,
  className,
}: {
  progress: BootstrapProgress | null;
  className?: string;
}) {
  const currentIndex = progress ? stepIndex(progress.step) : -1;

  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-body-sm text-on-surface-variant">
        Baixando checklist, itens esperados, conferências, avarias, temperaturas e catálogo para uso
        offline...
      </p>

      <ul className="space-y-2">
        {(Object.keys(STEP_LABELS) as BootstrapStep[]).map((step) => {
          const index = stepIndex(step);
          const done = currentIndex > index;
          const active = progress?.step === step;

          return (
            <li key={step} className="flex items-center gap-2 text-body-sm">
              {done ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-secondary" />
              ) : active ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : (
                <span className="inline-block h-4 w-4 shrink-0 rounded-full border border-outline-variant" />
              )}
              <span className={cn(active ? 'text-on-surface' : 'text-on-surface-variant')}>
                {STEP_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ul>

      {progress?.message ? (
        <p className="text-label-sm text-on-surface-variant">{progress.message}</p>
      ) : null}
    </div>
  );
}
