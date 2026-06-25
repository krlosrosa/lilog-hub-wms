'use client';

import { AlertTriangle, BookOpen, Power, PowerOff } from 'lucide-react';

import type { RegrasWmsStats } from '@/features/regras-wms/types/regra-wms.schema';

type RegrasWmsStatsCardsProps = {
  stats: RegrasWmsStats;
};

const STAT_CARDS = [
  {
    key: 'total' as const,
    label: 'Total de regras',
    icon: BookOpen,
    accent: 'text-primary bg-primary/10',
  },
  {
    key: 'ativas' as const,
    label: 'Ativas',
    icon: Power,
    accent: 'text-primary bg-primary/10',
  },
  {
    key: 'inativas' as const,
    label: 'Inativas',
    icon: PowerOff,
    accent: 'text-muted-foreground bg-muted',
  },
  {
    key: 'conflitosPotenciais' as const,
    label: 'Conflitos potenciais',
    icon: AlertTriangle,
    accent: 'text-destructive bg-destructive/10',
  },
] as const;

export function RegrasWmsStatsCards({ stats }: RegrasWmsStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {STAT_CARDS.map(({ key, label, icon: Icon, accent }) => (
        <div
          key={key}
          className="rounded-xl border border-outline-variant bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-caption font-medium text-muted-foreground">
              {label}
            </span>
            <span
              className={`flex size-8 items-center justify-center rounded-lg ${accent}`}
            >
              <Icon className="size-4" aria-hidden />
            </span>
          </div>
          <p className="text-headline-md font-semibold text-foreground">
            {stats[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
