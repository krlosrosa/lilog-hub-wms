'use client';

import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@lilog/ui';

import { useSidebarShell } from './sidebar-shell';

/**
 * Wrapper for main page content alongside the fixed `Sidebar`:
 * inset matches expanded width (`spacing.sidebar`) vs collapsed rail (`w-16`).
 */
export function SidebarMain({
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  const { collapsed } = useSidebarShell();

  return (
    <div
      className={cn(
        'ml-0 min-h-dvh pt-14 transition-[margin-left] duration-300 ease-in-out md:pt-0',
        collapsed ? 'md:ml-16' : 'md:ml-sidebar',
        className,
      )}
      {...props}
    />
  );
}
