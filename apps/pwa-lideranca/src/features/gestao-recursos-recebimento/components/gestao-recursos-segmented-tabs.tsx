'use client';

import { cn } from '@lilog/ui';
import { hapticLight } from '@/lib/haptics';
import type { LucideIcon } from 'lucide-react';

export type SegmentedTab<T extends string> = {
  id: T;
  label: string;
  icon?: LucideIcon;
  badge?: number;
  badgeTone?: 'default' | 'urgent' | 'active';
};

type GestaoRecursosSegmentedTabsProps<T extends string> = {
  tabs: SegmentedTab<T>[];
  active: T;
  onChange: (tab: T) => void;
};

const BADGE_TONE_CLASS = {
  default: 'bg-surface-container text-on-surface-variant',
  urgent: 'bg-error text-on-error',
  active: 'bg-primary text-on-primary',
};

export function GestaoRecursosSegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
}: GestaoRecursosSegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className="flex gap-1 rounded-xl bg-surface-container p-1"
    >
      {tabs.map(({ id, label, icon: Icon, badge, badgeTone = 'default' }) => {
        const isActive = active === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              hapticLight();
              onChange(id);
            }}
            className={cn(
              'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-label-sm font-semibold transition-all touch-manipulation active:scale-[0.98]',
              isActive
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-on-surface-variant',
            )}
          >
            {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
            <span className="truncate">{label}</span>
            {badge !== undefined && badge > 0 ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums',
                  isActive ? BADGE_TONE_CLASS[badgeTone] : BADGE_TONE_CLASS.default,
                )}
              >
                {badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
