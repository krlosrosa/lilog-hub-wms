import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';
import { isApiConfigured } from '@/lib/offline/api-client';
import { saveUnitDocasToDb } from '@/lib/offline/checklist-cache';
import { db } from '@/lib/offline/db';
import {
  loadCatalogoProdutos,
  saveCatalogoProdutos,
  saveDemandProdutos,
} from '@/lib/offline/produto-cache';
import { isCatalogStale, recordCatalogSync } from '@/lib/offline/sync-meta';

import {
  ensureConferenciaContext,
  saveConferenciaContextToDb,
  setConferenciaContextStore,
} from '../lib/conferencia-context-store';
import { mapConferenciaContext } from '../lib/map-conferencia-itens';
import {
  fetchAllProdutos,
  fetchConferenciaContext,
  listDocas,
} from '../lib/recebimento-api';
import type { Demand } from '../types/recebimento.schema';

export function useIniciarDemanda() {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIniciarDemanda = useCallback(
    async (demand: Demand) => {
      if (loadingId) return;

      hapticMedium();
      setLoadingId(demand.id);
      setError(null);

      try {
        if (
          demand.preRecebimentoSituacao === 'agendado' ||
          demand.preRecebimentoSituacao === 'aguardando'
        ) {
          throw new Error(
            'Esta carga ainda não foi liberada para conferência no painel web.',
          );
        }

        await db.demands.put(demand);

        const checklistDone = demand.preRecebimentoSituacao === 'em_conferencia';
        const unidadeId = demand.unidadeId;

        if (isApiConfigured() && navigator.onLine) {
          const [apiContext, docas] = await Promise.all([
            fetchConferenciaContext(demand.id),
            unidadeId
              ? listDocas(unidadeId).catch(() => [])
              : Promise.resolve([]),
          ]);

          const mapped = mapConferenciaContext(apiContext);
          await saveConferenciaContextToDb(demand.id, mapped);
          setConferenciaContextStore(demand.id, mapped);

          if (unidadeId && docas.length > 0) {
            await saveUnitDocasToDb(unidadeId, docas);
          }

          if (unidadeId) {
            const stale = await isCatalogStale(db, unidadeId);
            if (stale) {
              void fetchAllProdutos()
                .then(async (produtos) => {
                  if (produtos.length === 0) return;
                  await saveCatalogoProdutos(unidadeId, produtos);
                  await recordCatalogSync(db, unidadeId);
                  await saveDemandProdutos(demand.id, produtos);
                })
                .catch(() => {
                  // Catálogo anterior (se existir) continua válido.
                });
            }

            const existing = await loadCatalogoProdutos(unidadeId);
            if (existing.length > 0) {
              await saveDemandProdutos(demand.id, existing);
            }
          }
        } else {
          const cached = await ensureConferenciaContext(demand.id);
          if (checklistDone && !cached && isApiConfigured()) {
            throw new Error(
              'Sem conexão. Inicie a demanda com internet para carregar os dados.',
            );
          }

          if (unidadeId) {
            const existing = await loadCatalogoProdutos(unidadeId);
            if (existing.length > 0) {
              await saveDemandProdutos(demand.id, existing);
            }
          }
        }

        await navigate({
          to: checklistDone
            ? '/recebimento/$id/itens'
            : '/recebimento/$id/checklist',
          params: { id: demand.routeId },
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Não foi possível iniciar a demanda',
        );
      } finally {
        setLoadingId(null);
      }
    },
    [loadingId, navigate],
  );

  return { loadingId, error, handleIniciarDemanda };
}
