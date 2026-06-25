'use client';

import { BriefcaseBusiness, Menu } from 'lucide-react';

import { cn } from '@lilog/ui';

import { useSidebarShell } from './sidebar-shell';

export type MobileHeaderProps = {
  className?: string;
};

/** Fixed top bar on viewports below `md`; opens the mobile navigation drawer. */
export function MobileHeader({ className }: MobileHeaderProps) {
  const { openMobile } = useSidebarShell();

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-outline-variant bg-surface-low/95 px-4 backdrop-blur-glass md:hidden',
        className,
      )}
    >
      <button
        type="button"
        onClick={openMobile}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
        aria-label="Abrir menu de navegação"
      >
        <Menu aria-hidden className="size-5" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary shadow-inner-glow">
          <BriefcaseBusiness aria-hidden className="size-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-primary leading-tight">
            Lilog-Hub
          </p>
          <p className="truncate text-caption leading-tight font-medium uppercase tracking-wider text-muted-foreground">
            Logistica
          </p>
        </div>
      </div>
    </header>
  );
}
