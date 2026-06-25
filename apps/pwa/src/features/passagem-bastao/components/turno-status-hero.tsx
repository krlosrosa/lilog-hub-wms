import { cn } from '@lilog/ui';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';

import type { ChecklistStatusItem } from '../types/passagem-bastao.schema';
import { TurnoStatusRing } from './turno-status-ring';

interface TurnoStatusHeroProps {
  percent: number;
  statusItens: ChecklistStatusItem[];
  variant?: 'accent' | 'surface';
  className?: string;
}

export function TurnoStatusHero({
  percent,
  statusItens,
  variant = 'accent',
  className,
}: TurnoStatusHeroProps) {
  const isAccent = variant === 'accent';

  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-lg p-4 shadow-sm',
        isAccent
          ? 'bg-secondary-container text-on-secondary-container'
          : 'border border-outline-variant bg-surface',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <TurnoStatusRing
          percent={percent}
          size="lg"
          variant={isAccent ? 'on-accent' : 'default'}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <ClipboardCheck
              className={cn('h-5 w-5 shrink-0', isAccent ? 'opacity-90' : 'text-secondary')}
              aria-hidden
            />
            <h2
              className={cn(
                'text-headline-md font-semibold leading-tight',
                isAccent ? 'text-on-secondary-container' : 'text-on-surface',
              )}
            >
              Status do turno
            </h2>
          </div>
          <p
            className={cn(
              'text-body-sm',
              isAccent ? 'text-on-secondary-container/90' : 'text-on-surface-variant',
            )}
          >
            Checklists concluídos · pronto para validação
          </p>
        </div>
      </div>

      <ul className="space-y-2" aria-label="Itens do checklist">
        {statusItens.map((item) => (
          <li
            key={item.id}
            className={cn(
              'flex items-center justify-between rounded-lg px-3 py-2 text-label-sm',
              isAccent ? 'bg-on-secondary-container/10' : 'bg-surface-container-low',
            )}
          >
            <span
              className={isAccent ? 'text-on-secondary-container' : 'text-on-surface'}
            >
              {item.label}
            </span>
            {item.concluido ? (
              <CheckCircle2
                className={cn(
                  'h-4 w-4 shrink-0',
                  isAccent ? 'text-on-secondary-container' : 'text-secondary',
                )}
                aria-label="Concluído"
              />
            ) : (
              <span className="text-label-sm opacity-60">Pendente</span>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}
