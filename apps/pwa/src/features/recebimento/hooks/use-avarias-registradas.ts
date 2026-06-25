import { useCallback, useEffect, useRef, useState } from 'react';

import { isApiConfigured } from '@/lib/offline/api-client';

import { getAvariaRegistroLabels } from '../lib/avaria-labels';
import {
  getAvariasRegistradas,
  isAvariasSeeded,
  removeAvariaRegistrada,
  seedAvariasRegistradas,
} from '../lib/conferencia-avarias-store';
import { getConferenciaContextStore } from '../lib/conferencia-context-store';
import { mapAvariaApiToRegistro } from '../lib/map-avaria-api';
import { listAvarias } from '../lib/recebimento-api';
import { useDemandById } from './use-demand-by-id';

export function useAvariasRegistradas(demandId: string) {
  const demand = useDemandById(demandId);
  const fetchStartedRef = useRef(false);

  const [avariasRegistradas, setAvariasRegistradas] = useState(() =>
    getAvariasRegistradas(demandId),
  );
  const [avariasListExpanded, setAvariasListExpanded] = useState(false);

  const refreshAvarias = useCallback(() => {
    setAvariasRegistradas(getAvariasRegistradas(demandId));
  }, [demandId]);

  useEffect(() => {
    refreshAvarias();
  }, [refreshAvarias]);

  useEffect(() => {
    if (fetchStartedRef.current || isAvariasSeeded(demandId)) return;
    if (!isApiConfigured() || !navigator.onLine) return;

    const recebimentoId =
      getConferenciaContextStore(demandId)?.recebimentoId ??
      demand?.recebimentoId ??
      null;

    if (!recebimentoId) return;

    fetchStartedRef.current = true;

    void listAvarias(recebimentoId)
      .then((items) => {
        if (isAvariasSeeded(demandId)) return;
        seedAvariasRegistradas(
          demandId,
          items.map(mapAvariaApiToRegistro),
        );
        refreshAvarias();
      })
      .catch(() => {
        fetchStartedRef.current = false;
      });
  }, [demandId, demand?.recebimentoId, refreshAvarias]);

  const toggleAvariasListExpanded = useCallback(() => {
    setAvariasListExpanded((prev) => !prev);
  }, []);

  const removeAvaria = useCallback(
    (id: string) => {
      removeAvariaRegistrada(demandId, id);
      refreshAvarias();
    },
    [demandId, refreshAvarias],
  );

  return {
    avariasRegistradas,
    avariasListExpanded,
    toggleAvariasListExpanded,
    removeAvaria,
    getAvariaLabels: getAvariaRegistroLabels,
  };
}
