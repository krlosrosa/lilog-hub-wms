import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth';
import { useUnidade } from '@/features/unidade';
import { useNetworkStatus } from '@/lib/offline/hooks/use-network';

import { isActiveDemandProcess } from '../lib/active-demand-filter';
import { recebimentoV2Db } from '../local-db/db';
import { flushPendingSyncForUnidade } from '../services/flush-pending-sync-v2.service';
import { syncProcessList } from '../services/sync-process-list.service';
import type { ProcessRecord } from '../local-db/schema';

export interface UseListaDemandasV2Result {
  processos: ProcessRecord[];
  filteredProcessos: ProcessRecord[];
  search: string;
  setSearch: (value: string) => void;
  activeFilter: 'all' | 'priority';
  setActiveFilter: (value: 'all' | 'priority') => void;
  priorityCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  missingUnidadeId: boolean;
  fetchError: string | null;
  refresh: () => Promise<void>;
}

export function useListaDemandasV2(): UseListaDemandasV2Result {
  const { isLoading: isAuthLoading } = useAuth();
  const {
    unidadeSelecionada,
    isLoading: isUnidadeLoading,
  } = useUnidade();
  const { isOnline } = useNetworkStatus();
  const unidadeId = unidadeSelecionada?.id ?? '';
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'priority'>('all');

  const canSync = !isAuthLoading && !isUnidadeLoading && Boolean(unidadeId);

  const syncFromServer = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!unidadeId) return;

      setFetchError(null);
      setIsRefreshing(true);

      try {
        if (isOnline) {
          setIsSyncing(true);
          const { items, removedCount } = await syncProcessList(unidadeId);
          await flushPendingSyncForUnidade(unidadeId);

          if (!options?.silent) {
            if (removedCount > 0) {
              toast.success(
                removedCount === 1
                  ? '1 demanda antiga removida da lista'
                  : `${removedCount} demandas antigas removidas da lista`,
              );
            } else if (items.length > 0) {
              toast.success('Lista de demandas atualizada');
            } else {
              toast.info('Nenhuma demanda ativa no momento');
            }
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
    [isOnline, unidadeId],
  );

  useEffect(() => {
    if (!canSync) return;
    void syncFromServer({ silent: true });
  }, [canSync, syncFromServer]);

  const processosResult = useLiveQuery(async () => {
    if (!unidadeId) return [] as ProcessRecord[];

    const allProcessos = (await recebimentoV2Db.processes
      .where('unidadeId')
      .equals(unidadeId)
      .toArray()) as ProcessRecord[];

    const demands = await recebimentoV2Db.demands.bulkGet(allProcessos.map((p) => p.id));
    const demandById = new Map(
      demands
        .filter((demand): demand is NonNullable<typeof demand> => demand != null)
        .map((demand) => [demand.id, demand]),
    );

    const activeProcessos = allProcessos.filter((process) =>
      isActiveDemandProcess(process, demandById.get(process.id)),
    );

    return activeProcessos.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [unidadeId]);

  const processos = processosResult ?? [];

  const filteredProcessos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return processos.filter((process) => {
      const matchesSearch =
        !query ||
        process.id.toLowerCase().includes(query) ||
        (process.supplier ?? '').toLowerCase().includes(query) ||
        (process.dock ?? '').toLowerCase().includes(query) ||
        (process.placa ?? '').toLowerCase().includes(query) ||
        (process.conferente ?? '').toLowerCase().includes(query);
      const matchesPriority =
        activeFilter === 'all' ||
        process.status === 'pendingSync' ||
        process.status === 'conflict';
      return matchesSearch && matchesPriority;
    });
  }, [activeFilter, processos, search]);

  const priorityCount = useMemo(
    () =>
      processos.filter(
        (process) =>
          process.status === 'pendingSync' || process.status === 'conflict',
      ).length,
    [processos],
  );

  const isLoading =
    isAuthLoading ||
    isUnidadeLoading ||
    (canSync && processosResult === undefined);
  const missingUnidadeId =
    !isAuthLoading && !isUnidadeLoading && !unidadeId;

  return {
    processos,
    filteredProcessos,
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    priorityCount,
    isLoading,
    isSyncing,
    isRefreshing,
    isStale: !isOnline,
    missingUnidadeId,
    fetchError,
    refresh: () => syncFromServer(),
  };
}
