'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BriefcaseBusiness,
  Building2,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelRightOpen,
  RefreshCw,
  Settings,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { cn } from '@lilog/ui';

import {
  SELECIONAR_UNIDADE_PATH,
  useUnidadeContext,
} from '@/contexts/unidade-context';

import { sidebarConfig } from './sidebar-config';
import { SidebarNavGroup } from './sidebar-nav-group';
import { useSidebarShell } from './sidebar-shell';

export type SidebarUser = {
  name: string;
  role?: string;
  /** Any URL usable in `<img src>`; avoids Next/Image remote setup */
  avatarUrl?: string | null;
};

export type SidebarProps = {
  className?: string;
  /** Footer profile; omit uses default demo labels */
  user?: SidebarUser;
  settingsHref?: string;
  /** Called when logout control is clicked */
  onLogout?: () => void;
};

export function Sidebar({
  className,
  user = { name: 'Marcos Silveira', role: 'Master Franchisee', avatarUrl: null },
  settingsHref = '/configuracoes',
  onLogout,
}: SidebarProps) {
  const { collapsed, openGroupId, toggleCollapsed, onGroupHeaderClick } =
    useSidebarShell();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 flex h-dvh shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-outline-variant bg-surface-low transition-[width] duration-300 ease-in-out max-md:hidden',
        collapsed ? 'w-16' : 'w-sidebar',
        className,
      )}
      aria-label="Navegação principal"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <header
        className={cn(
          'flex shrink-0 items-start justify-between gap-1.5 px-4 pb-3 pt-3',
          collapsed && 'flex-col items-center px-2',
        )}
      >
        <div className={cn('flex min-w-0 flex-1 items-center gap-2', collapsed && 'flex-col gap-2')}>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary shadow-inner-glow">
            <BriefcaseBusiness aria-hidden className="size-4 text-primary-foreground" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-primary leading-tight">
                Lilog-Hub
              </h1>
              <p className="mt-0.5 truncate text-caption leading-tight font-medium uppercase tracking-wider text-muted-foreground">
                Logistica
              </p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-high"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        >
          {collapsed ? (
            <PanelRightOpen aria-hidden className="size-4" />
          ) : (
            <PanelLeftClose aria-hidden className="size-4" />
          )}
        </button>
      </header>

      <SidebarUnidadeBadge collapsed={collapsed} />

      <div
        className="shrink-0 border-t border-outline-variant"
        role="separator"
        aria-orientation="horizontal"
      />

      <nav className="flex flex-1 flex-col gap-0.5 px-2 pb-3 pt-3" aria-label="Seções">
        {sidebarConfig.map((group) => (
          <SidebarNavGroup
            key={group.id}
            group={group}
            collapsed={collapsed}
            isOpen={openGroupId === group.id}
            onHeaderClick={onGroupHeaderClick}
          />
        ))}
      </nav>

      <footer className="mt-auto shrink-0 space-y-1 border-t border-outline-variant p-3">
        {!collapsed ? (
          <div className="mb-1">
            <SidebarThemeButton collapsed={false} />
          </div>
        ) : (
          <div className="flex justify-center px-1">
            <SidebarThemeButton collapsed />
          </div>
        )}

        <Link
          href={settingsHref}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? 'Configurações' : undefined}
        >
          <Settings aria-hidden className="size-4 shrink-0" />
          {!collapsed ? <span className="font-medium leading-none">Configurações</span> : null}
        </Link>

        {!collapsed ? (
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-glass-bg/80 p-2 shadow-inner-glow backdrop-blur-glass">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-primary/20">
              <AvatarChip name={user.name} avatarUrl={user.avatarUrl ?? undefined} />
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
        ) : (
          <div className="flex justify-center pb-1">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-primary/20">
              <AvatarChip name={user.name} avatarUrl={user.avatarUrl ?? undefined} />
            </div>
          </div>
        )}
      </footer>
    </aside>
  );
}

function SidebarUnidadeBadge({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const { unidadeSelecionada } = useUnidadeContext();

  if (!unidadeSelecionada) {
    return null;
  }

  function handleTrocarUnidade() {
    router.push(SELECIONAR_UNIDADE_PATH);
  }

  if (collapsed) {
    return (
      <div className="flex justify-center px-2 pb-2">
        <button
          type="button"
          onClick={handleTrocarUnidade}
          className="rounded-md p-2 text-primary transition-colors hover:bg-surface-high"
          title={`Unidade: ${unidadeSelecionada.nome}`}
          aria-label={`Unidade ativa: ${unidadeSelecionada.nome}. Trocar unidade`}
        >
          <Building2 aria-hidden className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-glass-bg/80 px-2.5 py-2 shadow-inner-glow backdrop-blur-glass">
        <Building2 aria-hidden className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Unidade ativa
          </p>
          <p className="truncate text-xs font-semibold text-foreground">
            {unidadeSelecionada.nome}
          </p>
        </div>
        <button
          type="button"
          onClick={handleTrocarUnidade}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
          aria-label="Trocar unidade"
          title="Trocar unidade"
        >
          <RefreshCw aria-hidden className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function SidebarThemeButton({ collapsed }: { collapsed: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro';

  if (!mounted) {
    return <div className={collapsed ? 'size-9' : 'h-9 w-full'} aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground',
        collapsed && 'w-auto justify-center px-2',
      )}
      aria-label={label}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {!collapsed ? <span className="font-medium leading-none">Tema</span> : null}
    </button>
  );
}

function AvatarChip({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
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
