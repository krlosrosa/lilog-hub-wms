import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';
import { isApiConfigured } from '@/lib/offline/api-client';
import { saveUnitDocasToDb } from '@/lib/offline/checklist-cache';
import { db } from '@/lib/offline/db';
import { saveDemandProdutos } from '@/lib/offline/produto-cache';

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

        if (isApiConfigured() && navigator.onLine) {
          const [apiContext, docas, produtos] = await Promise.all([
            fetchConferenciaContext(demand.id),
            demand.unidadeId
              ? listDocas(demand.unidadeId).catch(() => [])
              : Promise.resolve([]),
            fetchAllProdutos().catch(() => []),
          ]);

          const mapped = mapConferenciaContext(apiContext);
          await saveConferenciaContextToDb(demand.id, mapped);
          setConferenciaContextStore(demand.id, mapped);

          if (demand.unidadeId && docas.length > 0) {
            await saveUnitDocasToDb(demand.unidadeId, docas);
          }

          if (produtos.length > 0) {
            await saveDemandProdutos(demand.id, produtos);
          }
        } else {
          const cached = await ensureConferenciaContext(demand.id);
          if (checklistDone && !cached && isApiConfigured()) {
            throw new Error(
              'Sem conexão. Inicie a demanda com internet para carregar os dados.',
            );
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
