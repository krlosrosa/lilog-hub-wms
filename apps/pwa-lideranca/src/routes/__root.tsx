import { createRootRoute, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { canAccessLeadershipApp, useAuth } from '@/features/auth';
import { AppBar, isAppBarHidden } from '@/components/layout/app-bar';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const prevPathname = useRef(pathname);
  const [animationClass, setAnimationClass] = useState('page-enter');
  const hideAppBar = isAppBarHidden(pathname);
  const isLoginRoute = pathname === '/login';
  const isAcessoNegadoRoute = pathname === '/acesso-negado';

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user && !isLoginRoute) {
      void navigate({ to: '/login', replace: true });
      return;
    }

    if (user && isLoginRoute) {
      if (canAccessLeadershipApp(user.role)) {
        void navigate({ to: '/', replace: true });
      } else {
        void navigate({ to: '/acesso-negado', replace: true });
      }
      return;
    }

    if (user && !canAccessLeadershipApp(user.role) && !isAcessoNegadoRoute) {
      void navigate({ to: '/acesso-negado', replace: true });
      return;
    }

    if (user && canAccessLeadershipApp(user.role) && isAcessoNegadoRoute) {
      void navigate({ to: '/', replace: true });
    }
  }, [user, isLoading, isLoginRoute, isAcessoNegadoRoute, navigate]);

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

  if (!user && !isLoginRoute) {
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
      {!hideAppBar && !isAcessoNegadoRoute && <AppBar />}
      <main
        className={`${animationClass} scroll-native min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-[calc(env(safe-area-inset-bottom,0px)+16px)]`}
      >
        <Outlet key={pathname} />
      </main>
    </div>
  );
}
