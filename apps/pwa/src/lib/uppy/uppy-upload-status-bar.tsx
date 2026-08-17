import StatusBar from '@uppy/react/status-bar';
import { useEffect, useRef, useState } from 'react';

import '@uppy/status-bar/css/style.min.css';

import {
  listUppyUploadSessions,
  subscribeUppyUploadSessions,
  type UppyUploadSession,
} from './uppy-upload-session-registry';

interface UppyUploadStatusBarProps {
  className?: string;
}

/** Only one mounted instance renders — Uppy allows one StatusBar plugin per instance. */
let primaryStatusBarMount: symbol | null = null;
const statusBarMountListeners = new Set<() => void>();

function notifyStatusBarMountListeners(): void {
  for (const listener of statusBarMountListeners) {
    listener();
  }
}

function usePrimaryStatusBarMount(): boolean {
  const mountIdRef = useRef(Symbol('uppy-upload-status-bar'));
  const [isPrimary, setIsPrimary] = useState(
    () => primaryStatusBarMount === null || primaryStatusBarMount === mountIdRef.current,
  );

  useEffect(() => {
    const mountId = mountIdRef.current;

    const syncPrimary = () => {
      setIsPrimary(
        primaryStatusBarMount === null || primaryStatusBarMount === mountId,
      );
    };

    if (primaryStatusBarMount === null) {
      primaryStatusBarMount = mountId;
    }

    syncPrimary();
    statusBarMountListeners.add(syncPrimary);

    return () => {
      statusBarMountListeners.delete(syncPrimary);
      if (primaryStatusBarMount === mountId) {
        primaryStatusBarMount = null;
        notifyStatusBarMountListeners();
      }
    };
  }, []);

  return isPrimary;
}

function UploadSessionStatusBar({ session }: { session: UppyUploadSession }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-2">
      <p className="mb-2 text-label-sm font-medium text-on-surface">{session.label}</p>
      <StatusBar
        uppy={session.uppy}
        id={`StatusBar:${session.id}`}
        hideUploadButton
        showProgressDetails
      />
    </div>
  );
}

export function UppyUploadStatusBar({ className }: UppyUploadStatusBarProps) {
  const isPrimary = usePrimaryStatusBarMount();
  const [sessions, setSessions] = useState<UppyUploadSession[]>(() => listUppyUploadSessions());

  useEffect(() => {
    return subscribeUppyUploadSessions(() => {
      setSessions(listUppyUploadSessions());
    });
  }, []);

  if (!isPrimary || sessions.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {sessions.map((session) => (
          <UploadSessionStatusBar key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}
