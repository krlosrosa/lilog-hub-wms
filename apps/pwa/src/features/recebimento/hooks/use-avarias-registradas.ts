import { useCallback, useEffect, useMemo, useState } from 'react';

import { isApiConfigured } from '@/lib/offline/api-client';
import { getChecklistDraft } from '@/lib/offline/checklist-cache';
import {
  hasAvariasCacheForDemand,
  loadAvariasForDemand,
  removeAvariaFromCache,
  saveAvariasForDemand,
} from '@/lib/offline/avaria-cache';
import { db } from '@/lib/offline/db';
import { deletePhotos, getPhotosByRelated } from '@/lib/offline/photo-store';

import { getAvariaRegistroLabels } from '../lib/avaria-labels';
import { filterAvariasForSku } from '../lib/avaria-quantidade';
import {
  getAvariasRegistradas,
  removeAvariaRegistrada,
  setAvariasRegistradas,
} from '../lib/conferencia-avarias-store';
import { getConferenciaContextStore } from '../lib/conferencia-context-store';
import { mapAvariaApiToRegistro } from '../lib/map-avaria-api';
import { listAvarias } from '../lib/recebimento-api';
import type { AvariaRegistro } from '../types/recebimento.schema';
import { useDemandById } from './use-demand-by-id';

export type AvariasRegistradasFilter = {
  sku?: string;
  produtoId?: string | null;
};

const avariasFetchInFlight = new Map<string, Promise<AvariaRegistro[]>>();

async function resolveRecebimentoId(
  demandId: string,
  demandRecebimentoId?: string | null,
): Promise<string | null> {
  const checklistDraft = await getChecklistDraft(demandId);
  return (
    getConferenciaContextStore(demandId)?.recebimentoId ??
    demandRecebimentoId ??
    checklistDraft?.recebimentoId ??
    null
  );
}

async function loadAvariasForDemandSession(
  demandId: string,
  recebimentoId: string | null,
): Promise<AvariaRegistro[]> {
  const fetchKey = `${demandId}:${recebimentoId ?? 'offline'}`;

  if (await hasAvariasCacheForDemand(demandId, recebimentoId)) {
    return loadAvariasForDemand(demandId, recebimentoId);
  }

  if (!isApiConfigured() || !navigator.onLine || !recebimentoId) {
    return loadAvariasForDemand(demandId, recebimentoId);
  }

  const existingFetch = avariasFetchInFlight.get(fetchKey);
  if (existingFetch) {
    return existingFetch;
  }

  const fetchPromise = (async () => {
    try {
      const items = await listAvarias(recebimentoId);
      const registros = items.map((item) => mapAvariaApiToRegistro(item, demandId));
      await saveAvariasForDemand(demandId, recebimentoId, registros);
      return registros;
    } catch {
      return loadAvariasForDemand(demandId, recebimentoId);
    } finally {
      avariasFetchInFlight.delete(fetchKey);
    }
  })();

  avariasFetchInFlight.set(fetchKey, fetchPromise);
  return fetchPromise;
}

export function useAvariasRegistradas(
  demandId: string,
  filter?: AvariasRegistradasFilter,
) {
  const demand = useDemandById(demandId);

  const [avariasRegistradas, setAvariasRegistradasState] = useState(() =>
    getAvariasRegistradas(demandId),
  );
  const [avariasListExpanded, setAvariasListExpanded] = useState(false);

  const refreshAvarias = useCallback(() => {
    setAvariasRegistradasState(getAvariasRegistradas(demandId));
  }, [demandId]);

  useEffect(() => {
    let cancelled = false;

    const syncAvarias = async () => {
      const recebimentoId = await resolveRecebimentoId(
        demandId,
        demand?.recebimentoId,
      );
      const registros = await loadAvariasForDemandSession(demandId, recebimentoId);

      if (cancelled) return;

      setAvariasRegistradas(demandId, registros);
      refreshAvarias();
    };

    void syncAvarias();

    return () => {
      cancelled = true;
    };
  }, [demand?.recebimentoId, demandId, refreshAvarias]);

  const toggleAvariasListExpanded = useCallback(() => {
    setAvariasListExpanded((prev) => !prev);
  }, []);

  const removeAvaria = useCallback(
    async (id: string) => {
      const recebimentoId = await resolveRecebimentoId(
        demandId,
        demand?.recebimentoId,
      );
      const current = getAvariasRegistradas(demandId);
      const next = current.filter((avaria) => avaria.id !== id);

      setAvariasRegistradas(demandId, next);
      refreshAvarias();
      await saveAvariasForDemand(demandId, recebimentoId, next);

      const orphanPhotos = await getPhotosByRelated(db, `avaria-queued-${id}`);
      const orphanPhotoIds = orphanPhotos
        .map((photo) => photo.id)
        .filter((photoId): photoId is number => photoId != null);
      if (orphanPhotoIds.length > 0) {
        await deletePhotos(db, orphanPhotoIds);
      }
    },
    [demand?.recebimentoId, demandId, refreshAvarias],
  );

  const filteredAvarias = useMemo(() => {
    if (!filter?.sku?.trim() && !filter?.produtoId) {
      return avariasRegistradas;
    }

    return filterAvariasForSku(
      avariasRegistradas,
      filter.sku ?? '',
      filter.produtoId,
    );
  }, [avariasRegistradas, filter?.produtoId, filter?.sku]);

  return {
    avariasRegistradas: filteredAvarias,
    avariasListExpanded,
    toggleAvariasListExpanded,
    removeAvaria,
    getAvariaLabels: getAvariaRegistroLabels,
  };
}
