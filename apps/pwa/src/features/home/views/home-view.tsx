import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeftRight,
  Boxes,
  ChevronRight,
  ClipboardCheck,
  CloudUpload,
  FlaskConical,
  LogIn,
  LogOut,
  PackageCheck,
  Sparkles,
  Wifi,
  WifiOff,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';

import { useAuth } from '@/features/auth';
import { hapticMedium } from '@/lib/haptics';
import { useNetworkStatus } from '@/lib/offline/hooks/use-network';
import { useSyncStatus } from '@/lib/offline/hooks/use-sync-status';

type ModuleStatus = 'available' | 'coming_soon';

interface ModuleItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: ModuleStatus;
  to?: string;
  featured?: boolean;
  iconTone: 'secondary' | 'primary' | 'warning';
}

const QUICK_ACCESS = [
  { id: 'recebimento', to: '/recebimento', label: 'Recebimento', icon: LogIn },
  { id: 'recebimento-v2', to: '/recebimento-v2', label: 'Receb. V2', icon: FlaskConical },
  { id: 'devolucao', to: '/devolucao', label: 'Devolução', icon: LogOut },
  { id: 'estoque', to: '/estoque', label: 'Estoque', icon: Boxes },
  { id: 'movimentacao', to: '/movimentacao', label: 'Movimentação', icon: ArrowLeftRight },
] as const;

const MODULES: ModuleItem[] = [
  {
    id: 'recebimento',
    title: 'Recebimento',
    description: 'Conferência e entrada de mercadorias',
    icon: LogIn,
    status: 'available',
    to: '/recebimento',
    featured: true,
    iconTone: 'secondary',
  },
  {
    id: 'passagem-bastao',
    title: 'Passagem de Bastão',
    description: 'Checklist e transferência de turno',
    icon: ClipboardCheck,
    status: 'available',
    to: '/passagem-bastao',
    featured: true,
    iconTone: 'warning',
  },
  {
    id: 'devolucao',
    title: 'Devolução',
    description: 'Processamento de devoluções',
    icon: LogOut,
    status: 'available',
    to: '/devolucao',
    iconTone: 'primary',
  },
  {
    id: 'movimentacao',
    title: 'Movimentação',
    description: 'Movimentação interna de estoque',
    icon: ArrowLeftRight,
    status: 'available',
    to: '/movimentacao',
    iconTone: 'secondary',
  },
  {
    id: 'estoque',
    title: 'Estoque',
    description: 'Contagem, ajuste e gestão de estoque',
    icon: Boxes,
    status: 'available',
    to: '/estoque',
    iconTone: 'secondary',
  },
  {
    id: 'expedicao',
    title: 'Expedição',
    description: 'Separação e conferência de expedição',
    icon: PackageCheck,
    status: 'available',
    to: '/expedicao',
    iconTone: 'primary',
  },
  {
    id: 'recebimento-v2',
    title: 'Recebimento V2',
    description: 'Conferência offline-first com sincronização inteligente',
    icon: FlaskConical,
    status: 'available',
    to: '/recebimento-v2',
    iconTone: 'secondary',
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getTurnoLabel(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'Turno manhã';
  if (hour >= 14 && hour < 22) return 'Turno tarde';
  return 'Turno noite';
}

function formatLastSync(iso: string | null): string {
  if (!iso) return 'Ainda não sincronizado';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Agora há pouco';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Há ${diffH}h`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const ICON_TONE_CLASS: Record<ModuleItem['iconTone'], string> = {
  secondary: 'bg-secondary-container text-on-secondary-container',
  primary: 'bg-primary-container text-on-primary-container',
  warning: 'bg-warning-container text-on-warning-container',
};

function WelcomeHero() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { pendingCount, errorCount, isSyncing, lastSyncAt, todaySyncedCount, hasIssues } =
    useSyncStatus();

  const greeting = useMemo(() => getGreeting(), []);
  const turno = useMemo(() => getTurnoLabel(), []);
  const lastSyncLabel = useMemo(() => formatLastSync(lastSyncAt), [lastSyncAt]);

  return (
    <section
      aria-label="Resumo do operador"
      className="relative mx-margin-mobile overflow-hidden rounded-xl border border-outline-variant/60 bg-primary-container p-4 text-on-primary-container shadow-sm"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-secondary opacity-25 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-1/3 h-24 w-24 rounded-full bg-secondary-container opacity-20 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-label-sm text-on-primary-container/75">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {turno}
          </p>
          <h1 className="mt-1 text-headline-lg-mobile font-semibold leading-tight text-on-secondary-container">
            {greeting}, {user?.name?.split(' ')[0] ?? 'Operador'}
          </h1>
          <p className="mt-1 text-body-sm text-on-primary-container/80">
            Escolha um módulo ou use os atalhos abaixo
          </p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-medium',
            isOnline
              ? hasIssues
                ? 'bg-error-container/30 text-on-error-container'
                : 'bg-secondary/20 text-on-secondary-container'
              : 'bg-warning-container/40 text-on-warning-container',
          )}
        >
          {isOnline ? (
            <Wifi className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <WifiOff className="h-3.5 w-3.5" aria-hidden />
          )}
          {isOnline ? (isSyncing ? 'Sincronizando' : 'Online') : 'Offline'}
        </span>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white/5 px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide text-on-primary-container/60">
            Pendentes
          </p>
          <p className="mt-0.5 font-mono text-headline-md font-bold tabular-nums text-on-secondary-container">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide text-on-primary-container/60">
            Hoje
          </p>
          <p className="mt-0.5 font-mono text-headline-md font-bold tabular-nums text-on-secondary-container">
            {todaySyncedCount}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-wide text-on-primary-container/60">
            Erros
          </p>
          <p
            className={cn(
              'mt-0.5 font-mono text-headline-md font-bold tabular-nums',
              errorCount > 0 ? 'text-destructive' : 'text-on-secondary-container',
            )}
          >
            {errorCount}
          </p>
        </div>
      </div>

      <p className="relative z-10 mt-3 flex items-center gap-1.5 text-[11px] text-on-primary-container/70">
        <CloudUpload className="h-3 w-3 shrink-0" aria-hidden />
        Última sync: {lastSyncLabel}
      </p>
    </section>
  );
}

function QuickAccessRow() {
  return (
    <section aria-label="Acesso rápido" className="mt-5">
      <div className="flex items-center justify-between px-margin-mobile">
        <h2 className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
          Acesso rápido
        </h2>
        <span className="inline-flex items-center gap-1 text-label-sm text-secondary">
          <Zap className="h-3.5 w-3.5" aria-hidden />
          Toque para abrir
        </span>
      </div>
      <div className="mt-3 flex gap-2.5 overflow-x-auto px-margin-mobile pb-1 hide-scrollbar">
        {QUICK_ACCESS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              onClick={() => hapticMedium()}
              className="flex w-[88px] shrink-0 flex-col items-center gap-2 rounded-xl border border-outline-variant/70 bg-surface p-3 shadow-sm active:bg-surface-container transition-colors touch-manipulation"
              aria-label={`Abrir ${item.label}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-container">
                <Icon className="h-5 w-5 text-on-secondary-container" aria-hidden />
              </div>
              <span className="text-center text-label-sm font-medium leading-tight text-on-surface">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedModuleCard({ module }: { module: ModuleItem }) {
  const Icon = module.icon;
  if (!module.to) return null;

  return (
    <Link
      to={module.to}
      onClick={() => hapticMedium()}
      className="group flex items-center gap-4 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm active:bg-surface-container transition-colors touch-manipulation"
      aria-label={`Abrir ${module.title}`}
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          ICON_TONE_CLASS[module.iconTone],
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-semibold text-on-surface">{module.title}</p>
        <p className="mt-0.5 line-clamp-1 text-body-sm text-on-surface-variant">
          {module.description}
        </p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

function ModuleCard({ module }: { module: ModuleItem }) {
  const Icon = module.icon;
  const isAvailable = module.status === 'available' && module.to;

  const cardInner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            ICON_TONE_CLASS[module.iconTone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {isAvailable ? (
          <ChevronRight className="h-5 w-5 shrink-0 text-outline" aria-hidden />
        ) : (
          <span className="inline-flex shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-medium text-on-surface-variant">
            Em breve
          </span>
        )}
      </div>
      <p className="mt-3 text-body-md font-semibold text-on-surface">{module.title}</p>
      <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">
        {module.description}
      </p>
    </>
  );

  const cardClassName = cn(
    'flex h-full flex-col rounded-lg border border-outline-variant bg-surface p-4 shadow-sm',
    isAvailable
      ? 'active:bg-surface-container transition-colors touch-manipulation'
      : 'pointer-events-none opacity-50',
  );

  if (isAvailable && module.to) {
    return (
      <Link
        to={module.to}
        onClick={() => hapticMedium()}
        className={cardClassName}
        aria-label={`Abrir ${module.title}`}
      >
        {cardInner}
      </Link>
    );
  }

  return (
    <article className={cardClassName} aria-disabled="true">
      {cardInner}
    </article>
  );
}

export function HomeView() {
  const featured = MODULES.filter((m) => m.featured);
  const gridModules = MODULES.filter((m) => !m.featured);

  return (
    <div className="page-enter flex flex-col pb-4">
      <div className="pt-4">
        <WelcomeHero />
      </div>

      <QuickAccessRow />

      <section className="mt-6 space-y-3 px-margin-mobile" aria-label="Módulos em destaque">
        <h2 className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
          Em destaque
        </h2>
        {featured.map((module) => (
          <FeaturedModuleCard key={module.id} module={module} />
        ))}
      </section>

      <section
        className="mt-6 grid grid-cols-2 gap-3 px-margin-mobile"
        aria-label="Todos os módulos"
      >
        <h2 className="col-span-2 text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
          Todos os módulos
        </h2>
        {gridModules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </section>
    </div>
  );
}
