'use client';

import type { ReactNode } from 'react';

import { useAuthContext } from '@/contexts/auth-context';

import { MobileHeader } from './mobile-header';
import { Sidebar } from './sidebar';
import { SidebarMobile } from './sidebar-mobile';
import { SidebarShellProvider } from './sidebar-shell';

/** Root shell: sidebar state context + sidebar + routed children. */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthContext();

  const sidebarUser = user
    ? { name: user.name, role: user.role, avatarUrl: null }
    : undefined;

  return (
    <SidebarShellProvider>
      <Sidebar user={sidebarUser} onLogout={logout} />
      <MobileHeader />
      <SidebarMobile user={sidebarUser} onLogout={logout} />
      {children}
    </SidebarShellProvider>
  );
}
