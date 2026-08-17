import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth';
import { fetchOperadorDemandas } from '@/features/recebimento/lib/recebimento-api';
import { useUnidade } from '@/features/unidade';
import { useDemandasReplicache, useReplicache } from '@/lib/replicache/hooks';
import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

import {
  isPriorityDemand,
  isReadyDemand,
  isWorkingDemand,
  matchesSearchQuery,
  sortDemandasByHorario,
} from '../lib/demand-view-ui';
import {
  flushPendingRcFinalizacaoSync,
  syncAllPendingRcChecklistPhotos,
} from '../services/sync-checklist-photos-rc.service';
import {
  reconcileAllRcDemandsWithOperadorApi,
  refreshReplicacheFromServer,
} from '../services/rc-replicache-refresh.service';

export interface UseListaDemandasRcResult {
  demandas: ReturnType<typeof useDemandasReplicache>;
  filteredDemandas: ReturnType<typeof useDemandasReplicache>;
  search: string;
  setSearch: (value: string) => void;
  priorityCount: number;
  workingCount: number;
  readyCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  missingUnidadeId: boolean;
  fetchError: string | null;
  operadorSituacaoById: Map<string, string>;
  refresh: () => Promise<void>;
}

export function useListaDemandasRc(): UseListaDemandasRcResult {
  const { isLoading: isAuthLoading } = useAuth();
  const { unidadeSelecionada, isLoading: isUnidadeLoading } = useUnidade();
  const { isOnline } = useNetworkStatus();
  const demandasRaw = useDemandasReplicache();
  const { rep, isReady } = useReplicache();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [operadorSituacaoById, setOperadorSituacaoById] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [search, setSearch] = useState('');

  const unidadeId = unidadeSelecionada?.id ?? '';
  const canSync = !isAuthLoading && !isUnidadeLoading && Boolean(unidadeId) && isReady;

  const demandas = useMemo(() => sortDemandasByHorario(demandasRaw), [demandasRaw]);

  const pullFromServer = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!rep || !unidadeId) {
        return;
      }

      setFetchError(null);
      setIsRefreshing(true);

      try {
        if (isOnline) {
          setIsSyncing(true);
          await syncAllPendingRcChecklistPhotos(rep);
          await flushPendingRcFinalizacaoSync();

          const operadorDemandas = await fetchOperadorDemandas(unidadeId).catch(() => []);
          setOperadorSituacaoById(
            new Map(
              operadorDemandas.map((demanda) => [
                demanda.preRecebimentoId,
                demanda.situacao,
              ]),
            ),
          );

          await reconcileAllRcDemandsWithOperadorApi(rep, unidadeId, operadorDemandas);
          await refreshReplicacheFromServer(rep);

          if (!options?.silent) {
            toast.success('Lista de demandas atualizada');
          }
        } else if (!options?.silent) {
          toast.warning('Sem conexão — exibindo demandas salvas no aparelho');
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao carregar demandas';
        setFetchError(message);
        if (!options?.silent) {
          toast.error(message);
        }
      } finally {
        setIsSyncing(false);
        setIsRefreshing(false);
      }
    },
    [isOnline, rep, unidadeId],
  );

  useEffect(() => {
    if (!canSync) {
      return;
    }

    void pullFromServer({ silent: true });
  }, [canSync, pullFromServer]);

  const filteredDemandas = useMemo(
    () => demandas.filter((demanda) => matchesSearchQuery(demanda, search)),
    [demandas, search],
  );

  const priorityCount = useMemo(
    () => demandas.filter(isPriorityDemand).length,
    [demandas],
  );

  const workingCount = useMemo(
    () => demandas.filter(isWorkingDemand).length,
    [demandas],
  );

  const readyCount = useMemo(
    () => demandas.filter(isReadyDemand).length,
    [demandas],
  );

  const isLoading =
    isAuthLoading ||
    isUnidadeLoading ||
    (Boolean(unidadeId) && !isReady);

  const missingUnidadeId = !isAuthLoading && !isUnidadeLoading && !unidadeId;

  return {
    demandas,
    filteredDemandas,
    search,
    setSearch,
    priorityCount,
    workingCount,
    readyCount,
    isLoading,
    isSyncing,
    isRefreshing,
    isStale: !isOnline,
    missingUnidadeId,
    fetchError,
    operadorSituacaoById,
    refresh: () => pullFromServer(),
  };
}
