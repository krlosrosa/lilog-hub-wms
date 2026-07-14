'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BriefcaseBusiness,
  LogOut,
  Moon,
  Settings,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

import {
  cn,
  Sheet,
  SheetContent,
  SheetTitle,
} from '@lilog/ui';

import { sidebarConfig } from './sidebar-config';
import { SidebarNavGroup } from './sidebar-nav-group';
import { useSidebarShell } from './sidebar-shell';
import type { SidebarUser } from './sidebar';

export type SidebarMobileProps = {
  user?: SidebarUser;
  settingsHref?: string;
  onLogout?: () => void;
};

/** Left drawer navigation for viewports below `md`. */
export function SidebarMobile({
  user = { name: 'Marcos Silveira', role: 'Master Franchisee', avatarUrl: null },
  settingsHref = '/configuracoes',
  onLogout,
}: SidebarMobileProps) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const {
    mobileOpen,
    setMobileOpen,
    closeMobile,
    openGroupId,
    onGroupHeaderClick,
  } = useSidebarShell();

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      closeMobile();
      prevPathname.current = pathname;
    }
  }, [pathname, closeMobile]);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="flex h-full w-[min(85vw,280px)] max-w-none flex-col gap-0 border-outline-variant bg-surface-low p-0 sm:max-w-[280px]"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>

        <header className="flex shrink-0 items-center gap-2 border-b border-outline-variant px-4 pb-3 pt-4 pr-12">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary shadow-inner-glow">
            <BriefcaseBusiness aria-hidden className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold tracking-tight text-primary leading-tight">
              Lilog-Hub
            </p>
            <p className="mt-0.5 truncate text-caption leading-tight font-medium uppercase tracking-wider text-muted-foreground">
              Logistica
            </p>
          </div>
        </header>

        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3"
          aria-label="Seções"
        >
          {sidebarConfig.map((group) => (
            <SidebarNavGroup
              key={group.id}
              group={group}
              collapsed={false}
              isOpen={openGroupId === group.id}
              onHeaderClick={onGroupHeaderClick}
            />
          ))}
        </nav>

        <footer className="mt-auto shrink-0 space-y-1 border-t border-outline-variant p-3">
          <SidebarMobileThemeButton />
          <Link
            href={settingsHref}
            onClick={closeMobile}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
          >
            <Settings aria-hidden className="size-4 shrink-0" />
            <span className="font-medium leading-none">Configurações</span>
          </Link>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-glass-bg/80 p-2 shadow-inner-glow backdrop-blur-glass">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-primary/20">
              <MobileAvatarChip name={user.name} avatarUrl={user.avatarUrl ?? undefined} />
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-sm font-medium leading-tight text-foreground">{user.name}</p>
              {user.role ? (
                <p className="truncate text-xs leading-tight text-muted-foreground">{user.role}</p>
              ) : null}
            </div>
            {onLogout ? (
              <button
                type="button"
                onClick={() => void onLogout?.()}
                className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
                aria-label="Sair"
              >
                <LogOut aria-hidden className="size-4" />
              </button>
            ) : null}
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

function SidebarMobileThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro';

  if (!mounted) {
    return <div className="h-9 w-full" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
      aria-label={label}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span className="font-medium leading-none">Tema</span>
    </button>
  );
}

function MobileAvatarChip({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- optional remote URLs without Image config
      <img src={avatarUrl} alt="" className="size-full object-cover" width={32} height={32} />
    );
  }

  return (
    <span
      aria-hidden
      className="flex size-full items-center justify-center bg-muted text-xs font-semibold uppercase text-muted-foreground"
    >
      {initials(name)}
    </span>
  );
}

function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const first = parts[0]![0];
  const last = parts[parts.length - 1]![0];
  return `${first}${last}`.toUpperCase();
}
