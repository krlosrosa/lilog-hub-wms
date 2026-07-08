'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  listarNotificacoes,
  marcarNotificacoesLidas,
  type NotificacaoPortalItem,
} from '../lib/notificacoes-api';

const POLLING_INTERVAL_MS = 60_000;

export function useNotificacoesPortal() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoPortalItem[]>(
    [],
  );
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const callbackRef = useRef<() => Promise<void>>(async () => {});

  const fetchNotificacoes = useCallback(async () => {
    try {
      const data = await listarNotificacoes({
        apenasNaoLidas: false,
        limit: 20,
      });
      setNotificacoes(data.notificacoes);
      setTotalNaoLidas(data.totalNaoLidas);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    callbackRef.current = fetchNotificacoes;
  }, [fetchNotificacoes]);

  useEffect(() => {
    let timer: number | undefined;

    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        void callbackRef.current();
      }, POLLING_INTERVAL_MS);
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

      void callbackRef.current();
      start();
    };

    void callbackRef.current();

    if (!document.hidden) {
      start();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const marcarLidas = useCallback(
    async (ids: string[]) => {
      await marcarNotificacoesLidas(ids);
      await fetchNotificacoes();
    },
    [fetchNotificacoes],
  );

  return {
    notificacoes,
    totalNaoLidas,
    isLoading,
    marcarLidas,
    refetch: fetchNotificacoes,
  };
}
