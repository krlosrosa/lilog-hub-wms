import { useCallback, useEffect, useRef, useState } from 'react';

import { useSessaoAtivaPwa } from '@/features/gestao-recursos/hooks/use-sessao-ativa-pwa';
import { recomputeKpisFromOperators } from '@/features/gestao-recursos/lib/gestao-recursos-mappers';
import type { KpiCard, Operator } from '@/features/gestao-recursos/types/gestao-recursos.schema';

import { mapRecursosRecebimentoToOperators } from '@/features/gestao-recursos-recebimento/lib/recebimento-recursos-mappers';

import {
  cancelarAlocacaoRecebimento,
  criarAlocacaoRecebimento,
  getRecursosRecebimentoSessao,
  liberarImpedimentoRecebimento,
} from '@/features/gestao-recursos-recebimento/api/recebimento-recursos-api';
import type {
  DemandaRecebimentoRecursoApi,
  RecursosRecebimentoSessaoApiResponse,
} from '@/features/gestao-recursos-recebimento/types/recebimento-recursos.api';

const POLL_INTERVAL_MS = 30_000;
const LIVE_TICK_MS = 1_000;

const EMPTY_KPIS: KpiCard[] = [
  {
    id: 'total-operadores',
    label: 'Total de Operadores',
    value: '0',
    suffix: '/ 0 na sessão',
    progress: 0,
    accent: 'primary',
  },
  {
    id: 'atuando',
    label: 'Atuando',
    value: '00',
    suffix: 'COM DEMANDA',
    accent: 'tertiary',
  },
  {
    id: 'precisam-pausa',
    label: 'Precisam pausa',
    value: '00',
    suffix: 'ORIENTAR',
    accent: 'warning',
  },
  {
    id: 'ociosos',
    label: 'Ociosos',
    value: '00',
    suffix: 'SEM MISSÃO',
    accent: 'destructive',
  },
  {
    id: 'em-pausa',
    label: 'Em Pausa',
    value: '00',
    suffix: 'AGORA',
    accent: 'muted',
  },
];

export function useGestaoRecursosRecebimento() {
  const sessaoState = useSessaoAtivaPwa({
    equipeArea: 'recebimento',
    storageKey: 'pwa-lideranca:gestao-recursos:recebimento:sessao-ativa',
  });
  const {
    sessaoAtiva,
    unidadeId,
    semUnidade,
    semSessaoAberta,
    isLoading: isLoadingSessao,
  } = sessaoState;

  const [operators, setOperators] = useState<Operator[]>([]);
  const [kpis, setKpis] = useState<KpiCard[]>(EMPTY_KPIS);
  const [demandas, setDemandas] = useState<DemandaRecebimentoRecursoApi[]>([]);
  const [apiKpis, setApiKpis] = useState<KpiCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [atribuindoId, setAtribuindoId] = useState<string | null>(null);
  const [cancelandoId, setCancellandoId] = useState<string | null>(null);
  const [liberandoId, setLiberandoId] = useState<string | null>(null);

  const lastResponseRef = useRef<RecursosRecebimentoSessaoApiResponse | null>(null);

  const applyResponse = useCallback(
    (response: RecursosRecebimentoSessaoApiResponse, now = new Date()) => {
      lastResponseRef.current = response;

      const mapped = mapRecursosRecebimentoToOperators(
        response.funcionarios,
        response.demandas,
        now,
      );

      setOperators(mapped);
      setKpis(recomputeKpisFromOperators(mapped, response.funcionarios.length));
      setDemandas(response.demandas);
      setApiKpis(response.kpis as KpiCard[]);
      setLastUpdatedAt(now);
    },
    [],
  );

  const load = useCallback(
    async (silent = false) => {
      if (!sessaoAtiva || !unidadeId) return;

      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      setLoadError(null);

      try {
        const response = await getRecursosRecebimentoSessao(
          sessaoAtiva.id,
          unidadeId,
        );
        applyResponse(response);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar dados de recebimento',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [sessaoAtiva, unidadeId, applyResponse],
  );

  const triggerRefresh = useCallback(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      void load(true);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (lastResponseRef.current) {
        applyResponse(lastResponseRef.current, new Date());
      }
    }, LIVE_TICK_MS);

    return () => clearInterval(tick);
  }, [applyResponse]);

  const handleAtribuir = useCallback(
    async (preRecebimentoId: string, sessaoFuncionarioId: string) => {
      if (!sessaoAtiva || !unidadeId) return;

      setAtribuindoId(preRecebimentoId);
      try {
        await criarAlocacaoRecebimento({
          unidadeId: unidadeId,
          preRecebimentoId,
          sessaoId: sessaoAtiva.id,
          sessaoFuncionarioId,
        });
        await load(true);
      } finally {
        setAtribuindoId(null);
      }
    },
    [sessaoAtiva, unidadeId, load],
  );

  const handleCancelarAlocacao = useCallback(
    async (alocacaoId: string) => {
      setCancellandoId(alocacaoId);
      try {
        await cancelarAlocacaoRecebimento(alocacaoId);
        await load(true);
      } finally {
        setCancellandoId(null);
      }
    },
    [load],
  );

  const handleLiberarImpedimento = useCallback(
    async (preRecebimentoId: string) => {
      setLiberandoId(preRecebimentoId);
      try {
        await liberarImpedimentoRecebimento(preRecebimentoId);
        await load(true);
      } finally {
        setLiberandoId(null);
      }
    },
    [load],
  );

  const canShowPainel =
    !semUnidade &&
    !semSessaoAberta &&
    !isLoadingSessao;

  return {
    ...sessaoState,
    isLoadingSessao,
    operators,
    kpis,
    demandas,
    apiKpis,
    isLoading,
    isRefreshing,
    lastUpdatedAt,
    loadError,
    canShowPainel,
    atribuindoId,
    cancelandoId,
    liberandoId,
    triggerRefresh,
    handleAtribuir,
    handleCancelarAlocacao,
    handleLiberarImpedimento,
  };
}
