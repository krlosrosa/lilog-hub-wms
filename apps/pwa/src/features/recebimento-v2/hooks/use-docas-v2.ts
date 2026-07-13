import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo } from 'react';

import type { DocaApi } from '@/features/recebimento/types/recebimento.api';
import { useUnidade } from '@/features/unidade';
import { docasToOptions } from '@/lib/offline/checklist-cache';
import { isApiConfigured } from '@/lib/offline/api-client';

import { fetchReferenceData } from '../api/sync-api';
import { recebimentoV2Db } from '../local-db/db';

export interface DocaOptionV2 {
  value: string;
  label: string;
}

function normalizeDocas(raw: unknown[], unidadeId: string): DocaApi[] {
  return raw.map((entry) => {
    const doca = entry as Record<string, unknown>;
    const codigo = String(doca.codigo ?? doca.label ?? doca.id ?? '');
    const nome = String(doca.nome ?? doca.label ?? codigo);
    return {
      id: String(doca.id),
      unidadeId: String(doca.unidadeId ?? unidadeId),
      codigo,
      nome,
    };
  });
}

export function useDocasV2(): {
  dockOptions: DocaOptionV2[];
  isLoading: boolean;
} {
  const { unidadeSelecionada } = useUnidade();
  const unidadeId = unidadeSelecionada?.id ?? '';

  const docaRecord = useLiveQuery(
    () => (unidadeId ? recebimentoV2Db.docas.get(unidadeId) : undefined),
    [unidadeId],
  );

  const dockOptions = useMemo(() => {
    const docas = normalizeDocas(docaRecord?.docas ?? [], unidadeId);
    return docasToOptions(docas);
  }, [docaRecord, unidadeId]);

  useEffect(() => {
    if (!unidadeId || dockOptions.length > 0) return;
    if (!navigator.onLine || !isApiConfigured()) return;

    let cancelled = false;

    async function loadDocas() {
      try {
        const refData = await fetchReferenceData(unidadeId);
        if (cancelled || !refData.docas?.length) return;

        await recebimentoV2Db.docas.put({
          unidadeId,
          docas: refData.docas,
          cachedAt: Date.now(),
        });
      } catch {
        // mantém cache local vazio
      }
    }

    void loadDocas();

    return () => {
      cancelled = true;
    };
  }, [unidadeId, dockOptions.length]);

  return {
    dockOptions,
    isLoading: unidadeId !== '' && docaRecord === undefined,
  };
}
