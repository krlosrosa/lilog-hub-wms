import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import * as Sentry from '@sentry/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/features/auth';
import { AppBar, isAppBarHidden } from '@/components/layout/app-bar';

export const Route = createRootRoute({
  component: RootLayout,
});

function ErroGlobal() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold">Algo deu errado</h2>
      <p className="text-sm text-muted-foreground">
        Ocorreu um erro inesperado. Nossa equipe foi notificada.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-on-secondary"
      >
        Recarregar
      </button>
    </div>
  );
}

function RootLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevPathname = useRef(pathname);
  const [animationClass, setAnimationClass] = useState('page-enter');
  const hideAppBar = isAppBarHidden(pathname);
  const isLoginRoute = pathname === '/login';
  const isAlterarSenhaRoute = pathname === '/alterar-senha';
  const isPublicRoute =
    isLoginRoute ||
    pathname.startsWith('/manobra') ||
    pathname.startsWith('/rastreio');

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user && !isPublicRoute) {
      void navigate({ to: '/login', replace: true });
      return;
    }

    if (user?.mustChangePassword && !isAlterarSenhaRoute) {
      void navigate({ to: '/alterar-senha', replace: true });
      return;
    }

    if (user && isLoginRoute) {
      void navigate({ to: '/', replace: true });
    }
  }, [user, isLoading, isPublicRoute, isLoginRoute, isAlterarSenhaRoute, navigate]);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setAnimationClass('page-enter');
      prevPathname.current = pathname;
    }
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-on-background">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-label="Carregando" />
      </div>
    );
  }

  if (!user && !isPublicRoute) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-on-background">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-label="Redirecionando" />
      </div>
    );
  }

  if (user?.mustChangePassword && !isAlterarSenhaRoute) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-on-background">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-label="Redirecionando" />
      </div>
    );
  }

  if (user && isLoginRoute) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-on-background">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-label="Redirecionando" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background text-on-background">
      {!hideAppBar && <AppBar />}
      <main
        className={`${animationClass} scroll-native min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-[calc(env(safe-area-inset-bottom,0px)+16px)]`}
      >
        <Sentry.ErrorBoundary fallback={<ErroGlobal />}>
          <Outlet key={pathname} />
        </Sentry.ErrorBoundary>
      </main>
    </div>
  );
}
