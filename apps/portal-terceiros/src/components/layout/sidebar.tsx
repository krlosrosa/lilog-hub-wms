'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertCircle,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelRightOpen,
  Sun,
  Truck,
  Wrench,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';

import { useAuthContext } from '@/contexts/auth-context';
import { NotificacoesDropdown } from '@/features/notificacoes/components/notificacoes-dropdown';

import { usePortalSidebar } from './use-portal-sidebar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/debitos', label: 'Débitos', icon: AlertCircle },
  { href: '/frota', label: 'Gestão de Frota', icon: Wrench },
] as const;

type PortalSidebarContextValue = ReturnType<typeof usePortalSidebar>;

const PortalSidebarContext = createContext<PortalSidebarContextValue | null>(null);

function usePortalSidebarShell(): PortalSidebarContextValue {
  const ctx = useContext(PortalSidebarContext);

  if (!ctx) {
    throw new Error('usePortalSidebarShell must be used within PortalShell');
  }

  return ctx;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={collapsed ? 'size-9' : 'h-9 w-full'} aria-hidden />;
  }

  const isDark = resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground',
        collapsed ? 'size-9 justify-center' : 'w-full gap-2.5 px-3 py-2',
      )}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {!collapsed ? (
        <span className="font-medium">{isDark ? 'Tema claro' : 'Tema escuro'}</span>
      ) : null}
    </button>
  );
}

export function PortalSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();
  const { collapsed, toggleCollapsed } = usePortalSidebarShell();
  const displayName = user?.transportadoraNome ?? 'Transportadora';

  return (
    <aside
      className={cn(
        'relative flex h-dvh shrink-0 flex-col overflow-x-hidden border-r border-border/60 bg-gradient-to-b from-primary/[0.07] via-card to-card transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-[17.5rem]',
      )}
      aria-label="Navegação principal"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div
        className="pointer-events-none absolute -left-16 top-8 size-44 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 bottom-24 size-32 rounded-full bg-secondary/10 blur-3xl"
        aria-hidden
      />

      <header
        className={cn(
          'relative shrink-0 pb-4 pt-6',
          collapsed ? 'flex flex-col items-center gap-2 px-2' : 'px-5',
        )}
      >
        <div
          className={cn(
            'flex w-full items-center',
            collapsed ? 'flex-col gap-2' : 'justify-between gap-2',
          )}
        >
          <div
            className={cn(
              'flex min-w-0 items-center',
              collapsed ? 'flex-col gap-2' : 'gap-3',
            )}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Truck className="size-5 text-primary-foreground" aria-hidden />
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Portal
                </p>
                <h2 className="truncate text-lg font-bold tracking-tight text-foreground">
                  Terceiros
                </h2>
              </div>
            ) : null}
          </div>

          {!collapsed ? (
            <div className="flex shrink-0 items-center gap-0.5">
              <NotificacoesDropdown />
              <button
                type="button"
                onClick={toggleCollapsed}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                aria-expanded
                aria-label="Recolher menu lateral"
                title="Recolher menu"
              >
                <PanelLeftClose className="size-4" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>

        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <NotificacoesDropdown />
            <button
              type="button"
              onClick={toggleCollapsed}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              aria-expanded={false}
              aria-label="Expandir menu lateral"
              title="Expandir menu"
            >
              <PanelRightOpen className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </header>

      <div
        className={cn(
          'h-px bg-gradient-to-r from-transparent via-border to-transparent',
          collapsed ? 'mx-2' : 'mx-5',
        )}
        role="separator"
        aria-orientation="horizontal"
      />

      <nav
        className={cn('relative flex-1 py-5', collapsed ? 'px-2' : 'px-3')}
        aria-label="Seções"
      >
        {!collapsed ? (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
        ) : null}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                    collapsed ? 'justify-center px-1.5 py-2.5' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-foreground/15'
                        : 'bg-muted/80 group-hover:bg-muted',
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {!collapsed ? item.label : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer
        className={cn(
          'relative mt-auto shrink-0 space-y-2 border-t border-border/60',
          collapsed ? 'p-2' : 'p-4',
        )}
      >
        <ThemeToggle collapsed={collapsed} />

        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/20"
              title={displayName}
              aria-hidden
            >
              {initials(displayName)}
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-background/60 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-primary/20"
                aria-hidden
              >
                {initials(displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user?.transportadoraNome}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Sair"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </footer>
    </aside>
  );
}

export function PortalShell({ children }: { children: ReactNode }) {
  const { isLoading } = useAuthContext();
  const sidebar = usePortalSidebar();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </div>
      </div>
    );
  }

  return (
    <PortalSidebarContext.Provider value={sidebar}>
      <div className="flex h-dvh overflow-hidden bg-muted/30">
        <PortalSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    </PortalSidebarContext.Provider>
  );
}
