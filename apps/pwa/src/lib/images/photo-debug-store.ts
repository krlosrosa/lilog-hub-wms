import { useEffect, useState } from 'react';

export type PhotoDebugEntry = {
  id: string;
  at: string;
  event: string;
  summary: string;
  detail: string;
};

const MAX_ENTRIES = 10;

let entries: PhotoDebugEntry[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function pushPhotoDebugEntry(
  entry: Omit<PhotoDebugEntry, 'id' | 'at'> & { at?: string },
): void {
  entries = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: entry.at ?? new Date().toLocaleTimeString('pt-BR'),
      event: entry.event,
      summary: entry.summary,
      detail: entry.detail,
    },
    ...entries,
  ].slice(0, MAX_ENTRIES);

  notifyListeners();
}

export function clearPhotoDebugEntries(): void {
  entries = [];
  notifyListeners();
}

export function getPhotoDebugEntries(): PhotoDebugEntry[] {
  return [...entries];
}

export function usePhotoDebugEntries(): PhotoDebugEntry[] {
  const [state, setState] = useState<PhotoDebugEntry[]>(() => [...entries]);

  useEffect(() => {
    const refresh = () => setState([...entries]);
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, []);

  return state;
}
