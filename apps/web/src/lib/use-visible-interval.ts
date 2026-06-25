'use client';

import { useEffect, useRef } from 'react';

export function useVisibleInterval(
  callback: () => void,
  delayMs: number | null,
  enabled = true,
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || delayMs === null) {
      return;
    }

    let timer: number | undefined;

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        callbackRef.current();
      }, delayMs);
    };

    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
        return;
      }

      callbackRef.current();
      start();
    };

    if (!document.hidden) {
      start();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [delayMs, enabled]);
}
