'use client';

import {
  AlertTriangle,
  Forklift,
  Package,
  Printer,
} from 'lucide-react';
import Link from 'next/link';

import { cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/op-wms/components/op-wms-panel-classes';
import type { QuickAction } from '@/features/op-wms/types/op-wms.schema';

const ICON_MAP = {
  forklift: Forklift,
  inventory: Package,
  print: Printer,
  emergency: AlertTriangle,
} as const;

type QuickActionsHudProps = {
  actions: QuickAction[];
  onShortcut?: (shortcut: string) => void;
};

export function QuickActionsHud({ actions, onShortcut }: QuickActionsHudProps) {
  const renderAction = (action: QuickAction) => {
    const Icon = ICON_MAP[action.icon];
    const isDestructive = action.variant === 'destructive';

    const content = (
      <div
        className={cn(
          glassPanelClassName,
          'flex items-center justify-between p-4 transition-all active:scale-95',
          isDestructive
            ? 'hover:border-destructive'
            : 'hover:border-primary',
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'rounded p-2',
              isDestructive
                ? 'bg-destructive/10 text-destructive'
                : 'bg-primary/10 text-primary',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="text-left">
            <p className="text-label-sm font-bold text-foreground">{action.label}</p>
            <p className="text-caption text-muted-foreground">
              {action.shortcut} Shortcut
            </p>
          </div>
        </div>
        <span
          className={cn(
            'rounded border border-outline-variant bg-surface-high px-1.5 py-0.5 text-caption font-mono transition-colors',
            isDestructive
              ? 'group-hover:border-destructive'
              : 'group-hover:border-primary',
          )}
        >
          {action.shortcut}
        </span>
      </div>
    );

    if (action.href) {
      return (
        <Link
          key={action.id}
          href={action.href}
          className="group block"
          onClick={() => onShortcut?.(action.shortcut)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={action.id}
        type="button"
        className="group w-full text-left"
        onClick={() => onShortcut?.(action.shortcut)}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="mb-8 grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
      {actions.map(renderAction)}
    </div>
  );
}
