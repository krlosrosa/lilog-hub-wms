import { useCallback, useMemo, useState } from 'react';

import type { ConferenceMode } from '../types/conference-mode';

const MODE_STORAGE_PREFIX = 'v3-mode-';

function readStoredMode(demandId: string): ConferenceMode | null {
  if (typeof sessionStorage === 'undefined') return null;
  const value = sessionStorage.getItem(`${MODE_STORAGE_PREFIX}${demandId}`);
  return value === 'online' || value === 'offline' ? value : null;
}

function writeStoredMode(demandId: string, mode: ConferenceMode): void {
  sessionStorage.setItem(`${MODE_STORAGE_PREFIX}${demandId}`, mode);
}

export function clearStoredMode(demandId: string): void {
  sessionStorage.removeItem(`${MODE_STORAGE_PREFIX}${demandId}`);
}

export function useModeV3(demandId: string) {
  const [mode, setModeState] = useState<ConferenceMode | null>(() =>
    readStoredMode(demandId),
  );

  const setMode = useCallback(
    (nextMode: ConferenceMode) => {
      writeStoredMode(demandId, nextMode);
      setModeState(nextMode);
    },
    [demandId],
  );

  const clearMode = useCallback(() => {
    clearStoredMode(demandId);
    setModeState(null);
  }, [demandId]);

  return useMemo(
    () => ({
      mode,
      hasMode: mode != null,
      setMode,
      clearMode,
    }),
    [clearMode, mode, setMode],
  );
}
