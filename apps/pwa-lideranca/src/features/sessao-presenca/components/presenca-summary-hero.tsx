import { cn } from '@lilog/ui';
import { Users } from 'lucide-react';

import type { PresencaStats } from '../types';
import { PresencaProgressRing } from './presenca-progress-ring';

export interface PresencaSummaryHeroProps {
  stats: PresencaStats;
  escalaNome?: string;
  equipeNome?: string;
  variant?: 'accent' | 'surface';
}

export function PresencaSummaryHero({
  stats,
  escalaNome,
  equipeNome,
  variant = 'accent',
}: PresencaSummaryHeroProps) {
  const isAccent = variant === 'accent';

  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-lg p-4 shadow-sm',
        isAccent
          ? 'bg-secondary-container text-on-secondary-container'
          : 'border border-outline-variant bg-surface',
      )}
    >
      <div className="flex items-center gap-4">
        <PresencaProgressRing
          percent={stats.percentPresentes}
          size="lg"
          variant={isAccent ? 'on-accent' : 'default'}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Users
              className={cn('h-5 w-5 shrink-0', isAccent ? 'opacity-90' : 'text-secondary')}
              aria-hidden
            />
            <h2
              className={cn(
                'text-headline-md font-semibold leading-tight',
                isAccent ? 'text-on-secondary-container' : 'text-on-surface',
              )}
            >
              Presença da equipe
            </h2>
          </div>
          {escalaNome ? (
            <p
              className={cn(
                'truncate text-body-sm font-medium',
                isAccent ? 'text-on-secondary-container/90' : 'text-on-surface',
              )}
            >
              {escalaNome}
            </p>
          ) : null}
          {equipeNome ? (
            <p
              className={cn(
                'truncate text-label-sm',
                isAccent ? 'text-on-secondary-container/75' : 'text-on-surface-variant',
              )}
            >
              {equipeNome}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatPill
          label="Presentes"
          value={stats.presentes}
          total={stats.total}
          tone="success"
          isAccent={isAccent}
        />
        <StatPill
          label="Pendentes"
          value={stats.pendentes}
          total={stats.total}
          tone="neutral"
          isAccent={isAccent}
        />
        <StatPill
          label="Faltas"
          value={stats.faltas}
          total={stats.total}
          tone="danger"
          isAccent={isAccent}
        />
      </div>
    </article>
  );
}

function StatPill({
  label,
  value,
  total,
  tone,
  isAccent,
}: {
  label: string;
  value: number;
  total: number;
  tone: 'success' | 'neutral' | 'danger';
  isAccent: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg px-2 py-2 text-center',
        isAccent ? 'bg-on-secondary-container/10' : 'bg-surface-container-low',
      )}
    >
      <p
        className={cn(
          'font-mono text-headline-md font-bold tabular-nums',
          tone === 'success' && !isAccent && 'text-secondary',
          tone === 'danger' && !isAccent && 'text-destructive',
          isAccent && 'text-on-secondary-container',
        )}
      >
        {value}
        <span className="text-label-sm font-normal opacity-60">/{total}</span>
      </p>
      <p
        className={cn(
          'text-[10px] font-medium uppercase tracking-wide',
          isAccent ? 'text-on-secondary-container/75' : 'text-on-surface-variant',
        )}
      >
        {label}
      </p>
    </div>
  );
}
