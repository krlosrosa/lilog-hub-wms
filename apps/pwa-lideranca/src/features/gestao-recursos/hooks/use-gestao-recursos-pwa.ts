import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getRecursosDevolucaoSessao,
  getRecursosSessao,
} from '@/features/gestao-recursos/api/gestao-recursos-api';
import { useSessaoAtivaPwa } from '@/features/gestao-recursos/hooks/use-sessao-ativa-pwa';
import {
  compareOperadoresEmPausa,
  mapApiRecursosToOperators,
  mapRecursosDevolucaoToOperators,
  mergeOperadoresRecursos,
  recomputeKpisFromOperators,
  sortOperadoresParaLider,
} from '@/features/gestao-recursos/lib/gestao-recursos-mappers';
import type {
  RecursosDevolucaoSessaoApiResponse,
  RecursosSessaoApiResponse,
} from '@/features/gestao-recursos/types/gestao-recursos.api';
import type {
  GestaoRecursosFilter,
  GestaoRecursosProcessoFilter,
  KpiCard,
  Operator,
} from '@/features/gestao-recursos/types/gestao-recursos.schema';

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
    id: 'ociosidade-critica',
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

type CachedRecursosResponses = {
  operacional: RecursosSessaoApiResponse;
  devolucao: RecursosDevolucaoSessaoApiResponse;
};

function filtrarPorBusca(operators: Operator[], query: string): Operator[] {
  const termo = query.trim().toLowerCase();

  if (!termo) {
    return operators;
  }

  return operators.filter(
    (operator) =>
      operator.name.toLowerCase().includes(termo) ||
      operator.sector.toLowerCase().includes(termo) ||
      operator.currentMission?.toLowerCase().includes(termo),
  );
}

function filtrarPorStatus(
  operators: Operator[],
  filter: GestaoRecursosFilter,
): Operator[] {
  switch (filter) {
    case 'atuando':
      return operators.filter((operator) => operator.status === 'atuando');
    case 'precisa_pausa':
      return operators.filter(
        (operator) => operator.precisaPausa && !operator.emPausa,
      );
    case 'em_pausa':
      return operators.filter((operator) => operator.emPausa);
    case 'ociosos':
      return operators.filter((operator) => operator.status === 'ocioso');
    default:
      return operators;
  }
}

function ordenarPorFiltro(
  operators: Operator[],
  filter: GestaoRecursosFilter,
): Operator[] {
  if (filter === 'precisa_pausa') {
    return [...operators].sort(
      (a, b) => (b.pausaAtrasoMinutos ?? 0) - (a.pausaAtrasoMinutos ?? 0),
    );
  }

  if (filter === 'em_pausa') {
    return [...operators].sort(compareOperadoresEmPausa);
  }

  if (filter === 'all') {
    return sortOperadoresParaLider(operators);
  }

  return [...operators].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR'),
  );
}

function resolveOperatorsFromResponses(
  responses: CachedRecursosResponses,
  processoFilter: GestaoRecursosProcessoFilter,
  now: Date,
): { operators: Operator[]; kpis: KpiCard[] } {
  const operacional = mapApiRecursosToOperators(responses.operacional, now);
  const devolucao = mapRecursosDevolucaoToOperators(responses.devolucao, now);
  const totalFuncionarios = Math.max(
    responses.operacional.funcionarios.length,
    responses.devolucao.funcionarios.length,
  );

  if (processoFilter === 'operacional') {
    return operacional;
  }

  if (processoFilter === 'devolucao') {
    return devolucao;
  }

  const mergedOperators = mergeOperadoresRecursos(
    operacional.operators,
    devolucao.operators,
  );

  return {
    operators: mergedOperators,
    kpis: recomputeKpisFromOperators(mergedOperators, totalFuncionarios),
  };
}

export function useGestaoRecursosPwa() {
  const sessaoState = useSessaoAtivaPwa();
  const { sessaoAtiva, semUnidade, semSessaoAberta } = sessaoState;

  const [operators, setOperators] = useState<Operator[]>([]);
  const [kpis, setKpis] = useState<KpiCard[]>(EMPTY_KPIS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<GestaoRecursosFilter>('all');
  const [processoFilter, setProcessoFilter] =
    useState<GestaoRecursosProcessoFilter>('todos');
  const [isLoadingRecursos, setIsLoadingRecursos] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [lastApiResponses, setLastApiResponses] =
    useState<CachedRecursosResponses | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyApiResponses = useCallback(
    (
      responses: CachedRecursosResponses,
      processo: GestaoRecursosProcessoFilter,
      now = new Date(),
    ) => {
      const { operators: mapped, kpis: mappedKpis } =
        resolveOperatorsFromResponses(responses, processo, now);
      setOperators(mapped);
      setKpis(mappedKpis);
      setLastUpdatedAt(now);
    },
    [],
  );

  const loadRecursosFromApi = useCallback(async () => {
    if (!sessaoAtiva) {
      setOperators([]);
      setKpis(EMPTY_KPIS);
      setLastApiResponses(null);
      setLoadError(null);
      return;
    }

    setIsLoadingRecursos(true);
    setLoadError(null);

    try {
      const [operacional, devolucao] = await Promise.all([
        getRecursosSessao(sessaoAtiva.id),
        getRecursosDevolucaoSessao(sessaoAtiva.id),
      ]);

      const responses: CachedRecursosResponses = { operacional, devolucao };
      setLastApiResponses(responses);
    } catch (error) {
      setLastApiResponses(null);
      setOperators([]);
      setKpis(EMPTY_KPIS);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os recursos.',
      );
    } finally {
      setIsLoadingRecursos(false);
    }
  }, [sessaoAtiva]);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await sessaoState.reload();
      await loadRecursosFromApi();
    } finally {
      setIsRefreshing(false);
    }
  }, [sessaoState, loadRecursosFromApi]);

  useEffect(() => {
    void loadRecursosFromApi();
  }, [loadRecursosFromApi]);

  useEffect(() => {
    if (!sessaoAtiva) {
      return;
    }

    const interval = setInterval(() => {
      void loadRecursosFromApi();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [sessaoAtiva, loadRecursosFromApi]);

  useEffect(() => {
    if (!lastApiResponses) {
      return;
    }

    applyApiResponses(lastApiResponses, processoFilter, new Date());
  }, [lastApiResponses, processoFilter, applyApiResponses]);

  useEffect(() => {
    if (!lastApiResponses) {
      return;
    }

    const interval = setInterval(() => {
      applyApiResponses(lastApiResponses, processoFilter, new Date());
    }, LIVE_TICK_MS);

    return () => clearInterval(interval);
  }, [lastApiResponses, processoFilter, applyApiResponses]);

  const counts = useMemo(
    () => ({
      all: operators.length,
      atuando: operators.filter((operator) => operator.status === 'atuando')
        .length,
      precisa_pausa: operators.filter(
        (operator) => operator.precisaPausa && !operator.emPausa,
      ).length,
      em_pausa: operators.filter((operator) => operator.emPausa).length,
      ociosos: operators.filter((operator) => operator.status === 'ocioso')
        .length,
    }),
    [operators],
  );

  const atrasadosCount = useMemo(
    () =>
      operators.filter(
        (operator) =>
          operator.precisaPausa &&
          !operator.emPausa &&
          (operator.pausaAtrasoMinutos ?? 0) > 0,
      ).length,
    [operators],
  );

  const filteredOperators = useMemo(() => {
    const searched = filtrarPorBusca(operators, searchQuery);
    const filtered = filtrarPorStatus(searched, filter);
    return ordenarPorFiltro(filtered, filter);
  }, [operators, searchQuery, filter]);

  const isLoading = sessaoState.isLoading || isLoadingRecursos;
  const canShowPainel = Boolean(sessaoAtiva) && !semUnidade && !semSessaoAberta;

  return {
    ...sessaoState,
    operators,
    kpis,
    counts,
    atrasadosCount,
    filteredOperators,
    searchQuery,
    filter,
    processoFilter,
    isLoading,
    isRefreshing,
    canShowPainel,
    lastUpdatedAt,
    loadError,
    setSearchQuery,
    setFilter,
    setProcessoFilter,
    triggerRefresh,
  };
}
