import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiClientError, isApiConfigured } from '@/lib/offline/api-client';

import { getConferenciaContextStore } from '../lib/conferencia-context-store';
import {
  fetchConferenciaContext,
  fetchTemperaturasProduto,
  upsertTemperaturaProduto,
} from '../lib/recebimento-api';
import type { TemperaturaProdutoEtapa } from '../types/recebimento.api';

export type TemperaturaProdutoEtapaState = {
  etapa: TemperaturaProdutoEtapa;
  label: string;
  shortLabel: string;
  temperatura: number | null;
  medidoEm: string | null;
};

const ETAPAS: Array<{
  etapa: TemperaturaProdutoEtapa;
  label: string;
  shortLabel: string;
}> = [
  { etapa: 'inicio', label: 'Início do baú', shortLabel: 'Início' },
  { etapa: 'meio', label: 'Meio do baú', shortLabel: 'Meio' },
  { etapa: 'fim', label: 'Fim do baú', shortLabel: 'Fim' },
];

const STORAGE_PREFIX = 'recebimento:temperaturas-produto';

function storageKey(demandId: string) {
  return `${STORAGE_PREFIX}:${demandId}`;
}

type CachedTemperaturas = Record<
  TemperaturaProdutoEtapa,
  { temperatura: number; medidoEm: string } | null
>;

function readCache(demandId: string): CachedTemperaturas {
  try {
    const raw = sessionStorage.getItem(storageKey(demandId));
    if (!raw) {
      return { inicio: null, meio: null, fim: null };
    }
    const parsed = JSON.parse(raw) as CachedTemperaturas;
    return {
      inicio: parsed.inicio ?? null,
      meio: parsed.meio ?? null,
      fim: parsed.fim ?? null,
    };
  } catch {
    return { inicio: null, meio: null, fim: null };
  }
}

function writeCache(demandId: string, cache: CachedTemperaturas) {
  sessionStorage.setItem(storageKey(demandId), JSON.stringify(cache));
}

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

function buildEtapas(cache: CachedTemperaturas): TemperaturaProdutoEtapaState[] {
  return ETAPAS.map((item) => {
    const reading = cache[item.etapa];
    return {
      etapa: item.etapa,
      label: item.label,
      shortLabel: item.shortLabel,
      temperatura: reading?.temperatura ?? null,
      medidoEm: reading?.medidoEm ?? null,
    };
  });
}

export function useTemperaturaProdutoEtapas(demandId: string) {
  const [cache, setCache] = useState<CachedTemperaturas>(() =>
    demandId ? readCache(demandId) : { inicio: null, meio: null, fim: null },
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const etapas = useMemo(() => buildEtapas(cache), [cache]);
  const preenchidas = etapas.filter((item) => item.temperatura != null).length;

  const load = useCallback(async () => {
    if (!demandId || !isApiConfigured()) {
      return;
    }

    setIsLoading(true);

    try {
      const recebimentoId = await resolveRecebimentoId(demandId);
      if (!recebimentoId) {
        return;
      }

      const response = await fetchTemperaturasProduto(recebimentoId);
      const next: CachedTemperaturas = { inicio: null, meio: null, fim: null };

      for (const item of response.items) {
        next[item.etapa] = {
          temperatura: item.temperatura,
          medidoEm: item.medidoEm,
        };
      }

      setCache(next);
      writeCache(demandId, next);
    } catch (error) {
      if (!(error instanceof ApiClientError && error.status === 404)) {
        setCache(readCache(demandId));
      }
    } finally {
      setIsLoading(false);
    }
  }, [demandId]);

  useEffect(() => {
    void load();
  }, [load]);

  const salvarEtapas = useCallback(
    async (
      entries: Array<{ etapa: TemperaturaProdutoEtapa; temperatura: number }>,
    ) => {
      if (!demandId || entries.length === 0) return false;

      setIsSaving(true);
      setSaveError(null);

      const optimistic: CachedTemperaturas = { ...cache };
      const now = new Date().toISOString();

      for (const entry of entries) {
        optimistic[entry.etapa] = {
          temperatura: entry.temperatura,
          medidoEm: now,
        };
      }

      setCache(optimistic);
      writeCache(demandId, optimistic);

      try {
        if (isApiConfigured()) {
          const recebimentoId = await resolveRecebimentoId(demandId);
          if (!recebimentoId) {
            throw new Error('Recebimento não encontrado para registrar temperatura.');
          }

          const synced: CachedTemperaturas = { ...optimistic };

          for (const entry of entries) {
            const saved = await upsertTemperaturaProduto(recebimentoId, entry);
            synced[entry.etapa] = {
              temperatura: saved.temperatura,
              medidoEm: saved.medidoEm,
            };
          }

          setCache(synced);
          writeCache(demandId, synced);
        }

        return true;
      } catch (error) {
        setCache(readCache(demandId));
        setSaveError(
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar as temperaturas.',
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [cache, demandId],
  );

  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  return {
    etapas,
    preenchidas,
    totalEtapas: ETAPAS.length,
    isLoading,
    isSaving,
    saveError,
    salvarEtapas,
    clearSaveError,
    reload: load,
  };
}
