import { Loader2, WifiOff } from 'lucide-react';

import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

import { useConferenceExecutorV3 } from '../context/conference-executor.context';

export function ConnectionBlocker({ children }: { children: React.ReactNode }) {
  const { mode } = useConferenceExecutorV3();
  const { isOnline } = useNetworkStatus();

  if (mode !== 'online' || isOnline) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[50vh]">
      {children}
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-scrim/70 p-6 backdrop-blur-[1px]">
        <div className="max-w-sm rounded-xl border border-outline-variant bg-surface p-5 text-center shadow-lg">
          <WifiOff className="mx-auto h-8 w-8 text-destructive" />
          <h2 className="mt-3 text-title-sm text-on-surface">Sem conexão com a internet</h2>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            Aguardando reconexão para continuar. Novas operações estão bloqueadas até a conexão
            ser restabelecida.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-body-sm text-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            Monitorando conexão...
          </div>
        </div>
      </div>
    </div>
  );
}
