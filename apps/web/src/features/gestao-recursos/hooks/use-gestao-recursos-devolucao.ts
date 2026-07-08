'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { toast } from 'sonner';

import type { PausaOperadorModalAction } from '@/features/gestao-recursos/components/confirmar-pausa-operador-modal';
import {
  compareOperadoresEmPausa,
  mapRecursosDevolucaoToOperators,
} from '@/features/gestao-recursos/lib/gestao-recursos-mappers';
import {
  getRecursosDevolucaoSessao,
  removerAlocacaoDevolucao,
} from '@/features/gestao-recursos/lib/gestao-recursos-api';
import { useSessaoAtivaGestaoRecursos } from '@/features/gestao-recursos/hooks/use-sessao-ativa-gestao-recursos';
import type {
  DemandaDevolucaoRecursoApi,
  RecursosDevolucaoSessaoApiResponse,
} from '@/features/gestao-recursos/types/gestao-recursos.api';
import type {
  KpiCard,
  Operator,
} from '@/features/gestao-recursos/types/gestao-recursos.schema';
import type { SessaoFuncionarioApi } from '@/features/sessao-operacao/types/sessao.api';
import {
  buildFuncionarioPorSessaoIdMap,
  funcionarioMatchesBusca,
} from '@/features/gestao-recursos/lib/funcionario-busca';
import {
  finalizarSessaoFuncionarioPausa,
  iniciarSessaoFuncionarioPausa,
} from '@/features/sessao-operacao/lib/sessao-operacao-api';
import { ApiClientError } from '@/lib/api';
import { useVisibleInterval } from '@/lib/use-visible-interval';

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

function filtrarPorBusca(
  operators: Operator[],
  query: string,
  funcionarios: SessaoFuncionarioApi[] = [],
): Operator[] {
  const termo = query.trim().toLowerCase();

  if (!termo) {
    return operators;
  }

  const funcionarioPorOperatorId = buildFuncionarioPorSessaoIdMap(funcionarios);

  return operators.filter((operator) => {
    const funcionario = funcionarioPorOperatorId.get(operator.id);

    return (
      operator.name.toLowerCase().includes(termo) ||
      operator.sector.toLowerCase().includes(termo) ||
      operator.currentMission?.toLowerCase().includes(termo) ||
      funcionarioMatchesBusca(funcionario, termo)
    );
  });
}

function resolveFuncionarioId(
  operatorId: string,
  funcionarios: SessaoFuncionarioApi[],
): number | null {
  return funcionarios.find((f) => f.id === operatorId)?.funcionarioId ?? null;
}

export function useGestaoRecursosDevolucao() {
  const {
    sessaoAtiva,
    sessoesAbertas,
    funcionarios,
    isLoading: isLoadingSessao,
    semUnidade,
    semSessaoAberta,
    reload: reloadSessao,
    selectSessao,
  } = useSessaoAtivaGestaoRecursos();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [kpis, setKpis] = useState<KpiCard[]>(EMPTY_KPIS);
  const [alocacoes, setAlocacoes] = useState<DemandaDevolucaoRecursoApi[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingRecursos, setIsLoadingRecursos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alocarModalOpen, setAlocarModalOpen] = useState(false);
  const [preselectedSessaoFuncionarioId, setPreselectedSessaoFuncionarioId] =
    useState<string | null>(null);
  const [removendoAlocacaoId, setRemovendoAlocacaoId] = useState<string | null>(
    null,
  );
  const [pausaModalOpen, setPausaModalOpen] = useState(false);
  const [pausaModalOperator, setPausaModalOperator] = useState<Operator | null>(null);
  const [pausaModalAction, setPausaModalAction] =
    useState<PausaOperadorModalAction | null>(null);
  const [isSubmittingPausa, setIsSubmittingPausa] = useState(false);
  const [lastApiResponse, setLastApiResponse] =
    useState<RecursosDevolucaoSessaoApiResponse | null>(null);
  const pausaAlertToastShownRef = useRef<Set<string>>(new Set());

  const applyApiResponse = useCallback(
    (response: RecursosDevolucaoSessaoApiResponse, now = new Date()) => {
      const { operators: mapped, kpis: apiKpis } = mapRecursosDevolucaoToOperators(
        response,
        now,
      );
      setOperators(mapped);
      setKpis(apiKpis);
      setAlocacoes(response.alocacoes);
    },
    [],
  );

  const loadRecursosFromApi = useCallback(async () => {
    if (!sessaoAtiva) {
      setOperators([]);
      setKpis(EMPTY_KPIS);
      setAlocacoes([]);
      setLastApiResponse(null);
      return;
    }

    setIsLoadingRecursos(true);

    try {
      const response = await getRecursosDevolucaoSessao(sessaoAtiva.id);
      setLastApiResponse(response);
      applyApiResponse(response);
    } catch {
      toast.error('Não foi possível carregar os recursos de devolução.');
      setOperators([]);
      setKpis(EMPTY_KPIS);
      setAlocacoes([]);
    } finally {
      setIsLoadingRecursos(false);
    }
  }, [sessaoAtiva, applyApiResponse]);

  useEffect(() => {
    void loadRecursosFromApi();
  }, [loadRecursosFromApi]);

  useVisibleInterval(
    () => {
      void loadRecursosFromApi();
    },
    POLL_INTERVAL_MS,
    Boolean(sessaoAtiva),
  );

  useVisibleInterval(
    () => {
      if (lastApiResponse) {
        applyApiResponse(lastApiResponse, new Date());
      }
    },
    LIVE_TICK_MS,
    Boolean(lastApiResponse),
  );

  useEffect(() => {
    if (!sessaoAtiva) {
      pausaAlertToastShownRef.current.clear();
      return;
    }

    for (const operator of operators) {
      if (!operator.precisaPausa || operator.emPausa) {
        continue;
      }

      if (pausaAlertToastShownRef.current.has(operator.id)) {
        continue;
      }

      pausaAlertToastShownRef.current.add(operator.id);
      toast.warning(`${operator.name} precisa entrar em pausa`, {
        description: 'Oriente o registro em Pausas para cumprir o intervalo do CD.',
      });
    }
  }, [operators, sessaoAtiva]);

  const filteredOperators = useMemo(
    () => filtrarPorBusca(operators, searchQuery, funcionarios),
    [operators, searchQuery, funcionarios],
  );

  const atuandoOperators = useMemo(
    () => filteredOperators.filter((operator) => operator.status === 'atuando'),
    [filteredOperators],
  );

  const ociososOperators = useMemo(
    () => filteredOperators.filter((operator) => operator.status === 'ocioso'),
    [filteredOperators],
  );

  const pausaOperators = useMemo(
    () =>
      filteredOperators
        .filter((operator) => operator.emPausa)
        .sort(compareOperadoresEmPausa),
    [filteredOperators],
  );

  const precisaPausaOperators = useMemo(
    () =>
      filteredOperators
        .filter((operator) => operator.precisaPausa && !operator.emPausa)
        .sort((a, b) => (b.pausaAtrasoMinutos ?? 0) - (a.pausaAtrasoMinutos ?? 0)),
    [filteredOperators],
  );

  const toggleRow = useCallback((operatorId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(operatorId)) {
        next.delete(operatorId);
      } else {
        next.add(operatorId);
      }
      return next;
    });
  }, []);

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await reloadSessao();
      await loadRecursosFromApi();
      toast.success('Dados atualizados');
    } finally {
      setIsRefreshing(false);
    }
  }, [reloadSessao, loadRecursosFromApi]);

  const openAlocarModal = useCallback((sessaoFuncionarioId?: string) => {
    setPreselectedSessaoFuncionarioId(sessaoFuncionarioId ?? null);
    setAlocarModalOpen(true);
  }, []);

  const closeAlocarModal = useCallback(() => {
    setAlocarModalOpen(false);
    setPreselectedSessaoFuncionarioId(null);
  }, []);

  const onAlocacaoCriada = useCallback(async () => {
    await loadRecursosFromApi();
  }, [loadRecursosFromApi]);

  const removerAlocacao = useCallback(
    async (alocacaoId: string) => {
      if (!sessaoAtiva) {
        return;
      }

      setRemovendoAlocacaoId(alocacaoId);

      try {
        await removerAlocacaoDevolucao(alocacaoId, sessaoAtiva.unidadeId);
        await loadRecursosFromApi();
        toast.success('Alocação removida');
      } catch {
        toast.error('Não foi possível remover a alocação');
      } finally {
        setRemovendoAlocacaoId(null);
      }
    },
    [sessaoAtiva, loadRecursosFromApi],
  );

  const openPausaConfirmModal = useCallback(
    (operatorId: string, action: PausaOperadorModalAction) => {
      const operator = operators.find((item) => item.id === operatorId);
      if (!operator) {
        return;
      }
      setPausaModalOperator(operator);
      setPausaModalAction(action);
      setPausaModalOpen(true);
    },
    [operators],
  );

  const closePausaConfirmModal = useCallback(() => {
    if (isSubmittingPausa) {
      return;
    }
    setPausaModalOpen(false);
    setPausaModalOperator(null);
    setPausaModalAction(null);
  }, [isSubmittingPausa]);

  const requestIniciarPausaTermica = useCallback(
    (operatorId: string) => {
      openPausaConfirmModal(operatorId, 'iniciar-termica');
    },
    [openPausaConfirmModal],
  );

  const requestEncerrarPausa = useCallback(
    (operatorId: string) => {
      openPausaConfirmModal(operatorId, 'encerrar');
    },
    [openPausaConfirmModal],
  );

  const confirmPausaAction = useCallback(async () => {
    if (!sessaoAtiva || !pausaModalOperator || !pausaModalAction) {
      return;
    }

    const funcionarioId = resolveFuncionarioId(
      pausaModalOperator.id,
      funcionarios,
    );

    if (funcionarioId == null) {
      toast.error('Não foi possível identificar o funcionário.');
      return;
    }

    setIsSubmittingPausa(true);

    try {
      if (pausaModalAction === 'iniciar-termica') {
        await iniciarSessaoFuncionarioPausa(sessaoAtiva.id, funcionarioId, {
          tipo: 'termica',
        });
        toast.success('Pausa térmica registrada');
      } else {
        await finalizarSessaoFuncionarioPausa(sessaoAtiva.id, funcionarioId);
        toast.success('Pausa encerrada');
      }

      setPausaModalOpen(false);
      setPausaModalOperator(null);
      setPausaModalAction(null);
      await loadRecursosFromApi();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Erro na operação de pausa';
      toast.error(message);
    } finally {
      setIsSubmittingPausa(false);
    }
  }, [
    sessaoAtiva,
    pausaModalOperator,
    pausaModalAction,
    funcionarios,
    loadRecursosFromApi,
  ]);

  const isLoading = isLoadingSessao || isLoadingRecursos;
  const canShowPainel = Boolean(sessaoAtiva) && !semUnidade && !semSessaoAberta;

  return {
    kpis,
    alocacoes,
    operators,
    atuandoOperators,
    ociososOperators,
    pausaOperators,
    precisaPausaOperators,
    expandedRows,
    searchQuery,
    isRefreshing,
    isLoading,
    isSubmitting,
    removendoAlocacaoId,
    canShowPainel,
    semUnidade,
    semSessaoAberta,
    sessaoAtiva,
    sessoesAbertas,
    funcionarios,
    alocarModalOpen,
    preselectedSessaoFuncionarioId,
    setSearchQuery,
    toggleRow,
    triggerRefresh,
    openAlocarModal,
    closeAlocarModal,
    onAlocacaoCriada,
    removerAlocacao,
    selectSessao,
    pausaModalOpen,
    pausaModalOperator,
    pausaModalAction,
    isSubmittingPausa,
    requestIniciarPausaTermica,
    requestEncerrarPausa,
    closePausaConfirmModal,
    confirmPausaAction,
    setIsSubmitting,
  };
}
