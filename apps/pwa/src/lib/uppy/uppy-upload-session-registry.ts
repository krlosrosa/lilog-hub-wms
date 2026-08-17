import type Uppy from '@uppy/core';
import type { Body, Meta } from '@uppy/utils';

export type UppyUploadSession = {
  id: string;
  label: string;
  uppy: Uppy<Meta, Body>;
  startedAt: number;
};

type Listener = () => void;

const sessions = new Map<string, UppyUploadSession>();
const listeners = new Set<Listener>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function registerUppyUploadSession(session: UppyUploadSession): void {
  sessions.set(session.id, session);
  notifyListeners();
}

export function unregisterUppyUploadSession(sessionId: string): void {
  sessions.delete(sessionId);
  notifyListeners();
}

export function listUppyUploadSessions(): UppyUploadSession[] {
  return [...sessions.values()].sort((a, b) => a.startedAt - b.startedAt);
}

export function subscribeUppyUploadSessions(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
