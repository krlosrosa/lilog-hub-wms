'use client';

import { createContext, useContext } from 'react';

import type { ReactNode } from 'react';

import { sidebarConfig } from './sidebar-config';
import { useSidebar } from './use-sidebar';

type SidebarShellValue = ReturnType<typeof useSidebar>;

const SidebarShellContext = createContext<SidebarShellValue | null>(null);

export function SidebarShellProvider({ children }: { children: ReactNode }) {
  const value = useSidebar(sidebarConfig);

  return (
    <SidebarShellContext.Provider value={value}>{children}</SidebarShellContext.Provider>
  );
}

export function useSidebarShell(): SidebarShellValue {
  const ctx = useContext(SidebarShellContext);

  if (!ctx) {
    throw new Error('useSidebarShell must be used within SidebarShellProvider');
  }

  return ctx;
}
