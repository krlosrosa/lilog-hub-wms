'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { toast } from 'sonner';

import { fetchRecursosSessao } from '@/features/gestao-recursos/lib/gestao-recursos-data';
import { getRecursosSessao, finalizarDemandaSeparacao } from '@/features/gestao-recursos/lib/gestao-recursos-api';
import type { PausaOperadorModalAction } from '@/features/gestao-recursos/components/confirmar-pausa-operador-modal';
import {
  compareOperadoresEmPausa,
  computeKpisFromOperators,
  mapApiRecursosToOperators,
  mapRecursosSessaoToOperators,
} from '@/features/gestao-recursos/lib/gestao-recursos-mappers';
import { useSessaoAtivaGestaoRecursos } from '@/features/gestao-recursos/hooks/use-sessao-ativa-gestao-recursos';
import type {
  DemandaSeparacaoApi,
  MapaGrupoProcessoApi,
  RecursosSessaoApiResponse,
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

function filtrarResponsePorProcesso(
  response: RecursosSessaoApiResponse,
  processo?: MapaGrupoProcessoApi,
): RecursosSessaoApiResponse {
  if (!processo) {
    return response;
  }

  const demandas = response.demandas.filter(
    (demanda) => demanda.mapaGrupoProcesso === processo,
  );

  return {
    ...response,
    demandas,
  };
}

function filtrarOperadoresPorProcesso(
  operators: Operator[],
  processo: MapaGrupoProcessoApi,
): Operator[] {
  return operators.map((operator) => {
    const tasks =
      operator.tasks?.filter((task) => task.processo === processo) ?? [];

    if (tasks.length === 0) {
      if (operator.status === 'atuando') {
        return {
          ...operator,
          status: 'ocioso' as const,
          currentMission: undefined,
          startTime: undefined,
          progress: undefined,
          expectedEnd: undefined,
          isLate: undefined,
          tasks: undefined,
        };
      }

      return operator;
    }

    const activeTask =
      tasks.find((task) => task.status === 'em_andamento') ?? tasks[0];

    return {
      ...operator,
      status: 'atuando' as const,
      currentMission: activeTask?.label,
      startTime: activeTask?.startTime,
      progress: activeTask?.progress,
      expectedEnd: activeTask?.expectedEndTime,
      isLate: activeTask?.isLate,
      tasks,
    };
  });
}

function marcarEquipeCarregamentoComoAtuando(
  operators: Operator[],
  demandas: DemandaSeparacaoApi[],
): Operator[] {
  const demandasAtivas = demandas.filter(
    (demanda) =>
      demanda.status === 'pendente' || demanda.status === 'em_andamento',
  );

  const alocacaoPorOperador = new Map<string, DemandaSeparacaoApi>();

  for (const demanda of demandasAtivas) {
    alocacaoPorOperador.set(demanda.sessaoFuncionarioId, demanda);

    for (const membro of demanda.funcionarios ?? []) {
      if (membro.papel === 'auxiliar') {
        alocacaoPorOperador.set(membro.sessaoFuncionarioId, demanda);
      }
    }
  }

  return operators.map((operator) => {
    const demanda = alocacaoPorOperador.get(operator.id);
    if (!demanda) {
      return operator;
    }

    const tasksCarregamento =
      operator.tasks?.filter((task) => task.processo === 'carregamento') ?? [];

    if (operator.status === 'atuando' && tasksCarregamento.length > 0) {
      return {
        ...operator,
        status: 'atuando' as const,
        currentMission: tasksCarregamento[0]?.label ?? demanda.mapaGrupoTitulo,
        tasks: tasksCarregamento,
      };
    }

    return {
      ...operator,
      status: 'atuando' as const,
      currentMission: demanda.mapaGrupoTitulo,
      tasks: [
        {
          id: demanda.id,
          mapaGrupoId: demanda.mapaGrupoId,
          processo: 'carregamento',
          label: demanda.mapaGrupoTitulo,
          status: 'em_andamento',
        },
      ],
    };
  });
}

export function useGestaoRecursos(options?: {
  processo?: MapaGrupoProcessoApi;
}) {
  const processo = options?.processo;
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingRecursos, setIsLoadingRecursos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cadastrarDemandaOpen, setCadastrarDemandaOpen] = useState(false);
  const [preselectedSessaoFuncionarioId, setPreselectedSessaoFuncionarioId] =
    useState<string | null>(null);
  const [finalizandoDemandaId, setFinalizandoDemandaId] = useState<string | null>(
    null,
  );
  const [finalizarDemandaModalOpen, setFinalizarDemandaModalOpen] =
    useState(false);
  const [finalizarDemandaId, setFinalizarDemandaId] = useState<string | null>(
    null,
  );
  const [finalizarDemandaMapaTitulo, setFinalizarDemandaMapaTitulo] = useState<
    string | null
  >(null);
  const [finalizarDemandaOperator, setFinalizarDemandaOperator] =
    useState<Operator | null>(null);
  const [pausaModalOpen, setPausaModalOpen] = useState(false);
  const [pausaModalOperator, setPausaModalOperator] = useState<Operator | null>(null);
  const [pausaModalAction, setPausaModalAction] =
    useState<PausaOperadorModalAction | null>(null);
  const [isSubmittingPausa, setIsSubmittingPausa] = useState(false);
  const [lastApiResponse, setLastApiResponse] =
    useState<RecursosSessaoApiResponse | null>(null);
  const [demandas, setDemandas] = useState<
    RecursosSessaoApiResponse['demandas']
  >([]);
  const pausaAlertToastShownRef = useRef<Set<string>>(new Set());

  const applyApiResponse = useCallback(
    (response: RecursosSessaoApiResponse, now = new Date()) => {
      const filteredResponse = filtrarResponsePorProcesso(response, processo);
      const { operators: mapped, kpis: apiKpis } = mapApiRecursosToOperators(
        filteredResponse,
        now,
      );
      const operatorsBase = processo
        ? filtrarOperadoresPorProcesso(mapped, processo)
        : mapped;
      const operators =
        processo === 'carregamento'
          ? marcarEquipeCarregamentoComoAtuando(
              operatorsBase,
              filteredResponse.demandas,
            )
          : operatorsBase;
      const kpis = processo
        ? computeKpisFromOperators(
            operators,
            sessaoAtiva?.totalFuncionarios ?? filteredResponse.funcionarios.length,
          )
        : apiKpis;

      setOperators(operators);
      setKpis(kpis);
      setDemandas(filteredResponse.demandas);
    },
    [processo, sessaoAtiva?.totalFuncionarios],
  );

  const loadRecursosFromApi = useCallback(async () => {
    if (!sessaoAtiva) {
      setOperators([]);
      setKpis(EMPTY_KPIS);
      setLastApiResponse(null);
      setDemandas([]);
      return;
    }

    setIsLoadingRecursos(true);

    try {
      const response = await getRecursosSessao(sessaoAtiva.id);
      setLastApiResponse(response);
      applyApiResponse(response);
    } catch {
      setLastApiResponse(null);
      try {
        const { funcionariosPausas } = await fetchRecursosSessao(
          sessaoAtiva.id,
          funcionarios,
        );
        const mapped = mapRecursosSessaoToOperators(funcionariosPausas);
        setOperators(mapped);
        setKpis(
          computeKpisFromOperators(mapped, sessaoAtiva.totalFuncionarios),
        );
      } catch {
        toast.error('Não foi possível carregar os recursos da sessão.');
        setOperators([]);
        setKpis(EMPTY_KPIS);
      }
    } finally {
      setIsLoadingRecursos(false);
    }
  }, [sessaoAtiva, funcionarios, applyApiResponse]);

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
        action: {
          label: 'Registrar',
          onClick: () => {
            window.location.href = '/pausas/registro';
          },
        },
      });
    }
  }, [operators, sessaoAtiva]);

  useEffect(() => {
    if (!finalizarDemandaModalOpen || !finalizarDemandaOperator) {
      return;
    }

    const atualizado = operators.find(
      (item) => item.id === finalizarDemandaOperator.id,
    );

    if (atualizado && atualizado !== finalizarDemandaOperator) {
      setFinalizarDemandaOperator(atualizado);
    }
  }, [
    operators,
    finalizarDemandaModalOpen,
    finalizarDemandaOperator,
  ]);

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

  const openCadastrarDemanda = useCallback((sessaoFuncionarioId?: string) => {
    setPreselectedSessaoFuncionarioId(sessaoFuncionarioId ?? null);
    setCadastrarDemandaOpen(true);
  }, []);

  const closeCadastrarDemanda = useCallback(() => {
    setCadastrarDemandaOpen(false);
    setPreselectedSessaoFuncionarioId(null);
  }, []);

  const onDemandasCriadas = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await loadRecursosFromApi();
      closeCadastrarDemanda();
      toast.success('Demandas atribuídas com sucesso');
    } finally {
      setIsSubmitting(false);
    }
  }, [loadRecursosFromApi, closeCadastrarDemanda]);

  const finalizarDemanda = useCallback(
    (demandaId: string, mapaTitulo?: string, operatorId?: string) => {
      const operator = operatorId
        ? operators.find((item) => item.id === operatorId) ?? null
        : null;

      setFinalizarDemandaId(demandaId);
      setFinalizarDemandaMapaTitulo(mapaTitulo ?? null);
      setFinalizarDemandaOperator(operator);
      setFinalizarDemandaModalOpen(true);
    },
    [operators],
  );

  const closeFinalizarDemandaModal = useCallback(() => {
    if (finalizandoDemandaId) {
      return;
    }
    setFinalizarDemandaModalOpen(false);
    setFinalizarDemandaId(null);
    setFinalizarDemandaMapaTitulo(null);
    setFinalizarDemandaOperator(null);
  }, [finalizandoDemandaId]);

  const confirmFinalizarDemanda = useCallback(async () => {
    if (!finalizarDemandaId) {
      return;
    }

    setFinalizandoDemandaId(finalizarDemandaId);

    try {
      await finalizarDemandaSeparacao(finalizarDemandaId);
      await loadRecursosFromApi();
      toast.success('Mapa finalizado com sucesso');
      setFinalizarDemandaModalOpen(false);
      setFinalizarDemandaId(null);
      setFinalizarDemandaMapaTitulo(null);
      setFinalizarDemandaOperator(null);
    } catch {
      toast.error('Não foi possível finalizar o mapa');
    } finally {
      setFinalizandoDemandaId(null);
    }
  }, [finalizarDemandaId, loadRecursosFromApi]);

  const openFilter = useCallback(() => {
    toast.info('Filtro por setor em breve');
  }, []);

  const openEmergencyReport = useCallback(() => {
    toast.error('Relatório de emergência acionado');
  }, []);

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
        toast.success('Pausa térmica registrada', {
          description: pausaModalOperator.name,
        });
      } else {
        await finalizarSessaoFuncionarioPausa(sessaoAtiva.id, funcionarioId);
        toast.success('Pausa encerrada', {
          description: pausaModalOperator.name,
        });
      }

      setPausaModalOpen(false);
      setPausaModalOperator(null);
      setPausaModalAction(null);
      await loadRecursosFromApi();
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : pausaModalAction === 'iniciar-termica'
            ? 'Não foi possível registrar a pausa térmica.'
            : 'Não foi possível encerrar a pausa.';

      toast.error('Erro na operação de pausa', { description: message });
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
    demandas,
    atuandoOperators,
    ociososOperators,
    pausaOperators,
    precisaPausaOperators,
    expandedRows,
    searchQuery,
    isRefreshing,
    isLoading,
    isSubmitting,
    finalizandoDemandaId,
    canShowPainel,
    semUnidade,
    semSessaoAberta,
    sessaoAtiva,
    sessoesAbertas,
    funcionarios,
    cadastrarDemandaOpen,
    preselectedSessaoFuncionarioId,
    setSearchQuery,
    toggleRow,
    triggerRefresh,
    openCadastrarDemanda,
    closeCadastrarDemanda,
    onDemandasCriadas,
    finalizarDemanda,
    finalizarDemandaModalOpen,
    finalizarDemandaOperator,
    finalizarDemandaMapaTitulo,
    closeFinalizarDemandaModal,
    confirmFinalizarDemanda,
    selectSessao,
    openFilter,
    openEmergencyReport,
    pausaModalOpen,
    pausaModalOperator,
    pausaModalAction,
    isSubmittingPausa,
    requestIniciarPausaTermica,
    requestEncerrarPausa,
    closePausaConfirmModal,
    confirmPausaAction,
    loadRecursosFromApi,
  };
}
