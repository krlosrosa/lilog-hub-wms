import { useEffect } from 'react';

import { registerOnlineSyncListener } from './sync-engine';

interface SyncProviderProps {
  children: React.ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  useEffect(() => registerOnlineSyncListener(), []);

  return children;
}
