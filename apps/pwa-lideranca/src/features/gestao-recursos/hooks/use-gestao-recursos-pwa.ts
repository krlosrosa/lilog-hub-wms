import { useCallback, useEffect, useMemo, useState } from 'react';

import { getRecursosSessao } from '@/features/gestao-recursos/api/gestao-recursos-api';
import { useSessaoAtivaPwa } from '@/features/gestao-recursos/hooks/use-sessao-ativa-pwa';
import {
  compareOperadoresEmPausa,
  mapApiRecursosToOperators,
  sortOperadoresParaLider,
} from '@/features/gestao-recursos/lib/gestao-recursos-mappers';
import type { RecursosSessaoApiResponse } from '@/features/gestao-recursos/types/gestao-recursos.api';
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

export function useGestaoRecursosPwa() {
  const sessaoState = useSessaoAtivaPwa();
  const { sessaoAtiva, semUnidade, semSessaoAberta } = sessaoState;

  const [operators, setOperators] = useState<Operator[]>([]);
  const [kpis, setKpis] = useState<KpiCard[]>(EMPTY_KPIS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<GestaoRecursosFilter>('all');
  const [isLoadingRecursos, setIsLoadingRecursos] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [lastApiResponse, setLastApiResponse] =
    useState<RecursosSessaoApiResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyApiResponse = useCallback(
    (response: RecursosSessaoApiResponse, now = new Date()) => {
      const { operators: mapped, kpis: apiKpis } = mapApiRecursosToOperators(
        response,
        now,
      );
      setOperators(mapped);
      setKpis(apiKpis);
      setLastUpdatedAt(now);
    },
    [],
  );

  const loadRecursosFromApi = useCallback(async () => {
    if (!sessaoAtiva) {
      setOperators([]);
      setKpis(EMPTY_KPIS);
      setLastApiResponse(null);
      setLoadError(null);
      return;
    }

    setIsLoadingRecursos(true);
    setLoadError(null);

    try {
      const response = await getRecursosSessao(sessaoAtiva.id);
      setLastApiResponse(response);
      applyApiResponse(response);
    } catch (error) {
      setLastApiResponse(null);
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
  }, [sessaoAtiva, applyApiResponse]);

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
    if (!lastApiResponse) {
      return;
    }

    const interval = setInterval(() => {
      applyApiResponse(lastApiResponse, new Date());
    }, LIVE_TICK_MS);

    return () => clearInterval(interval);
  }, [lastApiResponse, applyApiResponse]);

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
