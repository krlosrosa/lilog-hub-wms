import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getRecursosDevolucaoSessao,
  getRecursosSessao,
} from '@/features/gestao-recursos/api/gestao-recursos-api';
import { useSessaoAtivaPwa } from '@/features/gestao-recursos/hooks/use-sessao-ativa-pwa';
import {
  filtrarOperadoresPorProcesso,
  filtrarResponsePorProcesso,
  marcarEquipeCarregamentoComoAtuando,
} from '@/features/gestao-recursos/lib/filtrar-por-processo';
import {
  compareOperadoresEmPausa,
  mapApiRecursosToOperators,
  mapRecursosDevolucaoToOperators,
  recomputeKpisFromOperators,
  sortOperadoresParaLider,
} from '@/features/gestao-recursos/lib/gestao-recursos-mappers';
import type {
  GestaoRecursosProcessoApi,
  MapaGrupoProcessoApi,
  RecursosDevolucaoSessaoApiResponse,
  RecursosSessaoApiResponse,
} from '@/features/gestao-recursos/types/gestao-recursos.api';
import type {
  GestaoRecursosFilter,
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

function filtrarPorBusca(operators: Operator[], query: string): Operator[] {
  const termo = query.trim().toLowerCase();

  if (!termo) {
    return operators;
  }

  return operators.filter((operator) => {
    const mission = operator.currentMission?.toLowerCase() ?? '';
    return (
      operator.name.toLowerCase().includes(termo) ||
      operator.sector.toLowerCase().includes(termo) ||
      mission.includes(termo)
    );
  });
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

function isMapaGrupoProcesso(
  processo: GestaoRecursosProcessoApi,
): processo is MapaGrupoProcessoApi {
  return processo !== 'devolucao';
}

function mapOperacionalPorProcesso(
  response: RecursosSessaoApiResponse,
  processo: MapaGrupoProcessoApi,
  now: Date,
  totalFuncionarios: number,
): { operators: Operator[]; kpis: KpiCard[] } {
  const filteredResponse = filtrarResponsePorProcesso(response, processo);
  const { operators: mapped } = mapApiRecursosToOperators(filteredResponse, now);
  const operatorsBase = filtrarOperadoresPorProcesso(mapped, processo);
  const operators =
    processo === 'carregamento'
      ? marcarEquipeCarregamentoComoAtuando(
          operatorsBase,
          filteredResponse.demandas,
        )
      : operatorsBase;

  return {
    operators,
    kpis: recomputeKpisFromOperators(operators, totalFuncionarios),
  };
}

const EQUIPE_AREA_BY_PROCESSO: Partial<
  Record<GestaoRecursosProcessoApi, string>
> = {
  separacao: 'expedição',
  conferencia: 'expedição',
  carregamento: 'expedição',
  devolucao: 'devolução',
};

const STORAGE_KEY_BY_PROCESSO: Partial<
  Record<GestaoRecursosProcessoApi, string>
> = {
  separacao: 'pwa-lideranca:gestao-recursos:expedicao:sessao-ativa',
  conferencia: 'pwa-lideranca:gestao-recursos:expedicao:sessao-ativa',
  carregamento: 'pwa-lideranca:gestao-recursos:expedicao:sessao-ativa',
  devolucao: 'pwa-lideranca:gestao-recursos:devolucao:sessao-ativa',
};

export function useGestaoRecursosPwa(options: {
  processo: GestaoRecursosProcessoApi;
}) {
  const { processo } = options;
  const sessaoState = useSessaoAtivaPwa({
    equipeArea: EQUIPE_AREA_BY_PROCESSO[processo],
    storageKey: STORAGE_KEY_BY_PROCESSO[processo],
  });
  const { sessaoAtiva, semUnidade, semSessaoAberta } = sessaoState;

  const [operators, setOperators] = useState<Operator[]>([]);
  const [kpis, setKpis] = useState<KpiCard[]>(EMPTY_KPIS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<GestaoRecursosFilter>('all');
  const [isLoadingRecursos, setIsLoadingRecursos] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [lastOperacionalResponse, setLastOperacionalResponse] =
    useState<RecursosSessaoApiResponse | null>(null);
  const [lastDevolucaoResponse, setLastDevolucaoResponse] =
    useState<RecursosDevolucaoSessaoApiResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyCachedResponse = useCallback(
    (
      operacional: RecursosSessaoApiResponse | null,
      devolucao: RecursosDevolucaoSessaoApiResponse | null,
      now = new Date(),
    ) => {
      if (processo === 'devolucao') {
        if (!devolucao) {
          return;
        }

        const mapped = mapRecursosDevolucaoToOperators(devolucao, now);
        setOperators(mapped.operators);
        setKpis(mapped.kpis);
        setLastUpdatedAt(now);
        return;
      }

      if (!operacional) {
        return;
      }

      const mapped = mapOperacionalPorProcesso(
        operacional,
        processo,
        now,
        sessaoAtiva?.totalFuncionarios ?? operacional.funcionarios.length,
      );
      setOperators(mapped.operators);
      setKpis(mapped.kpis);
      setLastUpdatedAt(now);
    },
    [processo, sessaoAtiva?.totalFuncionarios],
  );

  const loadRecursosFromApi = useCallback(async () => {
    if (!sessaoAtiva) {
      setOperators([]);
      setKpis(EMPTY_KPIS);
      setLastOperacionalResponse(null);
      setLastDevolucaoResponse(null);
      setLoadError(null);
      return;
    }

    setIsLoadingRecursos(true);
    setLoadError(null);

    try {
      if (processo === 'devolucao') {
        const devolucao = await getRecursosDevolucaoSessao(sessaoAtiva.id);
        setLastDevolucaoResponse(devolucao);
        setLastOperacionalResponse(null);
        return;
      }

      const operacional = await getRecursosSessao(sessaoAtiva.id);
      setLastOperacionalResponse(operacional);
      setLastDevolucaoResponse(null);
    } catch (error) {
      setLastOperacionalResponse(null);
      setLastDevolucaoResponse(null);
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
  }, [processo, sessaoAtiva]);

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
    applyCachedResponse(lastOperacionalResponse, lastDevolucaoResponse, new Date());
  }, [
    lastOperacionalResponse,
    lastDevolucaoResponse,
    applyCachedResponse,
  ]);

  useEffect(() => {
    if (!lastOperacionalResponse && !lastDevolucaoResponse) {
      return;
    }

    const interval = setInterval(() => {
      applyCachedResponse(
        lastOperacionalResponse,
        lastDevolucaoResponse,
        new Date(),
      );
    }, LIVE_TICK_MS);

    return () => clearInterval(interval);
  }, [
    lastOperacionalResponse,
    lastDevolucaoResponse,
    applyCachedResponse,
  ]);

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
    processo,
    processoLabel: isMapaGrupoProcesso(processo)
      ? processo === 'separacao'
        ? 'Separação'
        : processo === 'conferencia'
          ? 'Conferência'
          : 'Carregamento'
      : 'Devolução',
    operators,
    kpis,
    counts,
    atrasadosCount,
    filteredOperators,
    searchQuery,
    filter,
    isLoading,
    isRefreshing,
    canShowPainel,
    lastUpdatedAt,
    loadError,
    setSearchQuery,
    setFilter,
    triggerRefresh,
  };
}
