import { Crown, LogOut, User } from 'lucide-react';

import { useAuth } from '@/features/auth';
import { UnidadeSelector } from '@/features/unidade';

export function isAppBarHidden(pathname: string) {
  return pathname !== '/';
}

export function AppBar() {
  const { user, logout } = useAuth();

  return (
    <header className="glass-header sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile pb-sm pt-safe dark:border-on-tertiary-container dark:bg-surface-container-lowest">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-container text-on-primary-container">
          <Crown className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <span className="block truncate text-headline-md font-bold text-secondary dark:text-secondary">
            {user?.name ?? 'LILOG Liderança'}
          </span>
          {user ? (
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="block truncate text-label-sm text-on-surface-variant">
                ID {user.id}
              </span>
              <UnidadeSelector compact />
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-primary" aria-hidden />
        <button
          type="button"
          onClick={() => void logout()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container active:bg-surface-container-high"
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
