import { createContext, useContext, useMemo, type ReactNode } from 'react';

import type { ConferenceMode } from '../types/conference-mode';
import type { ConferenceExecutor } from '../executors/conference-executor.interface';
import { onlineConferenceExecutor } from '../executors/online-conference-executor';
import { offlineConferenceExecutor } from '../executors/offline-conference-executor';

type ConferenceExecutorContextValue = {
  mode: ConferenceMode;
  executor: ConferenceExecutor;
};

const ConferenceExecutorContext = createContext<ConferenceExecutorContextValue | null>(null);

export function ConferenceExecutorProvider({
  mode,
  children,
}: {
  mode: ConferenceMode;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      mode,
      executor: mode === 'online' ? onlineConferenceExecutor : offlineConferenceExecutor,
    }),
    [mode],
  );

  return (
    <ConferenceExecutorContext.Provider value={value}>
      {children}
    </ConferenceExecutorContext.Provider>
  );
}

export function useConferenceExecutorV3(): ConferenceExecutorContextValue {
  const context = useContext(ConferenceExecutorContext);
  if (!context) {
    throw new Error('useConferenceExecutorV3 must be used within ConferenceExecutorProvider');
  }
  return context;
}
