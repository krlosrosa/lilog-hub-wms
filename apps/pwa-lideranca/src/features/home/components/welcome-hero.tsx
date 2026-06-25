import { cn } from '@lilog/ui';
import { Crown, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

import { useAuth } from '@/features/auth';

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

function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

function WelcomeHero() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  const greeting = useMemo(() => getGreeting(), []);
  const turno = useMemo(() => getTurnoLabel(), []);

  return (
    <section
      aria-label="Resumo da liderança"
      className="relative mx-margin-mobile overflow-hidden rounded-xl border border-outline-variant/60 bg-primary-container p-4 text-on-primary-container shadow-sm"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-secondary opacity-20 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-1/3 h-24 w-24 rounded-full bg-secondary-container opacity-15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-label-sm text-on-primary-container/75">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {turno}
          </p>
          <h1 className="mt-1 text-headline-lg-mobile font-semibold leading-tight text-on-secondary-container">
            {greeting}, {user?.name?.split(' ')[0] ?? 'Líder'}
          </h1>
          <p className="mt-1 text-body-sm text-on-primary-container/80">
            Painel de gestão operacional
          </p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-medium',
            isOnline
              ? 'bg-secondary/20 text-on-secondary-container'
              : 'bg-warning-container/40 text-on-warning-container',
          )}
        >
          {isOnline ? (
            <Wifi className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <WifiOff className="h-3.5 w-3.5" aria-hidden />
          )}
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="relative z-10 mt-4 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5">
        <Crown className="h-4 w-4 shrink-0 text-on-secondary-container" aria-hidden />
        <p className="text-body-sm text-on-primary-container/85">
          Perfil de liderança · {user?.role === 'admin' ? 'Administrador' : 'Gerente'}
        </p>
      </div>
    </section>
  );
}

export { WelcomeHero };
