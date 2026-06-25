import { useEffect, useState } from 'react';

import { ApiClientError, isApiConfigured } from '@/lib/offline/api-client';

import {
  compareChecklistPhotos,
  resolveChecklistPhotoLabel,
} from '../lib/checklist-photo-label';
import { getConferenciaContextStore } from '../lib/conferencia-context-store';
import {
  fetchChecklist,
  fetchConferenciaContext,
  getDocumentDownloadUrl,
  listChecklistDocumentos,
} from '../lib/recebimento-api';
import type { ChecklistRecebimentoApi } from '../types/recebimento.api';

export type ChecklistPhotoPreview = {
  id: string;
  label: string;
  url: string;
};

export type ChecklistResumoState = {
  checklist: ChecklistRecebimentoApi | null;
  photos: ChecklistPhotoPreview[];
  isLoading: boolean;
  hasChecklist: boolean;
};

const INITIAL_STATE: ChecklistResumoState = {
  checklist: null,
  photos: [],
  isLoading: false,
  hasChecklist: false,
};

async function resolveRecebimentoId(demandId: string): Promise<string | null> {
  const cached = getConferenciaContextStore(demandId);
  if (cached?.recebimentoId) {
    return cached.recebimentoId;
  }

  if (!isApiConfigured()) {
    return null;
  }

  const context = await fetchConferenciaContext(demandId);
  return context.recebimentoId;
}

export function useChecklistResumo(demandId: string): ChecklistResumoState {
  const [state, setState] = useState<ChecklistResumoState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!demandId || !isApiConfigured()) {
        setState(INITIAL_STATE);
        return;
      }

      setState((current) => ({ ...current, isLoading: true }));

      try {
        const recebimentoId = await resolveRecebimentoId(demandId);

        if (!recebimentoId) {
          if (!cancelled) {
            setState(INITIAL_STATE);
          }
          return;
        }

        const checklist = await fetchChecklist(recebimentoId);
        const documentos = await listChecklistDocumentos(recebimentoId);
        const sorted = [...documentos].sort((a, b) =>
          compareChecklistPhotos(a.nome, b.nome),
        );

        const photos = await Promise.all(
          sorted.map(async (documento) => ({
            id: documento.id,
            label: resolveChecklistPhotoLabel(documento.nome),
            url: await getDocumentDownloadUrl(documento.id),
          })),
        );

        if (!cancelled) {
          setState({
            checklist,
            photos,
            isLoading: false,
            hasChecklist: true,
          });
        }
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiClientError && error.status === 404) {
          setState(INITIAL_STATE);
          return;
        }

        setState(INITIAL_STATE);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [demandId]);

  return state;
}
