'use client';

import { useCallback, useEffect, useReducer, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { calcularResumoBalanceamento } from '@/features/distribuicao-demandas/lib/calcular-balanceamento';
import {
  carregarDadosExecucaoDistribuicao,
  carregarPlanejamentoDistribuicao,
} from '@/features/distribuicao-demandas/lib/distribuicao-data-loader';
import {
  executarDistribuicao,
  type ResultadoExecucaoDistribuicao,
} from '@/features/distribuicao-demandas/lib/executar-distribuicao';
import { criarOperadoresVirtuais } from '@/features/distribuicao-demandas/lib/operadores-virtuais';
import {
  aplicarSimulacaoCompleta,
  recalcularComConfigAtual,
  recalcularEstadoDistribuicao,
  simularDistribuicao,
} from '@/features/distribuicao-demandas/lib/simular-distribuicao';
import {
  carregarTransportesSelecionados,
  limparTransportesSelecionados,
} from '@/features/distribuicao-demandas/lib/transportes-selecao';
import type {
  ConfigDistribuicao,
  Doca,
  EstadoDistribuicao,
  MapaIndex,
  Operador,
  TransporteExpedicao,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

type Action =
  | { type: 'INIT'; payload: EstadoDistribuicao }
  | { type: 'SET_CONFIG'; payload: Partial<ConfigDistribuicao> }
  | { type: 'RECALCULAR' }
  | { type: 'SIMULAR' }
  | {
      type: 'MOVER_TRANSPORTE';
      payload: {
        transporteId: string;
        deWorkloadId: string | null;
        paraWorkloadId: string | null;
      };
    }
  | { type: 'SET_PREVIEW'; payload: { workloadId: string | null } };

function operadoresFromConfig(config: ConfigDistribuicao): Operador[] {
  return criarOperadoresVirtuais(config.qtdFuncionarios);
}

function maxSeparadoresFromConfig(config: ConfigDistribuicao): number {
  return Math.max(1, Math.ceil(config.qtdFuncionarios / Math.max(1, config.qtdDocas)));
}

function criarEstadoInicial(
  transportes: TransporteExpedicao[],
  docas: Doca[],
  configInicial: ConfigDistribuicao,
): EstadoDistribuicao {
  const config: ConfigDistribuicao = {
    ...configInicial,
    maxSeparadoresPorWorkload: maxSeparadoresFromConfig(configInicial),
  };
  const operadores = operadoresFromConfig(config);
  const { workloads, transportesNaoAlocadosIds, operadoresDisponiveisIds } =
    simularDistribuicao(transportes, config, docas, operadores);
  const balanceamento = calcularResumoBalanceamento(workloads);

  return {
    transportes,
    config,
    docas,
    operadores,
    workloads,
    transportesNaoAlocadosIds,
    operadoresDisponiveisIds,
    workloadPreviewId: workloads[0]?.id ?? null,
    transportePreviewId: null,
    balanceamento,
  };
}

function reducer(state: EstadoDistribuicao, action: Action): EstadoDistribuicao {
  switch (action.type) {
    case 'INIT':
      return action.payload;

    case 'SET_CONFIG': {
      const merged = { ...state.config, ...action.payload };
      const config: ConfigDistribuicao = {
        ...merged,
        maxSeparadoresPorWorkload: maxSeparadoresFromConfig(merged),
      };
      const operadores = operadoresFromConfig(config);
      const { workloads, transportesNaoAlocadosIds, operadoresDisponiveisIds } =
        simularDistribuicao(state.transportes, config, state.docas, operadores);
      const balanceamento = calcularResumoBalanceamento(workloads);
      return {
        ...state,
        config,
        operadores,
        workloads,
        transportesNaoAlocadosIds,
        operadoresDisponiveisIds,
        workloadPreviewId: workloads[0]?.id ?? null,
        transportePreviewId: null,
        balanceamento,
      };
    }

    case 'RECALCULAR': {
      const operadores = operadoresFromConfig(state.config);
      const config: ConfigDistribuicao = {
        ...state.config,
        maxSeparadoresPorWorkload: maxSeparadoresFromConfig(state.config),
      };
      const { workloads, balanceamento, transportesNaoAlocadosIds } =
        recalcularComConfigAtual(
          state.workloads,
          state.transportes,
          config,
          state.docas,
          operadores,
        );
      return {
        ...state,
        config,
        operadores,
        workloads,
        balanceamento,
        transportesNaoAlocadosIds,
      };
    }

    case 'SIMULAR': {
      const operadores = operadoresFromConfig(state.config);
      const config: ConfigDistribuicao = {
        ...state.config,
        maxSeparadoresPorWorkload: maxSeparadoresFromConfig(state.config),
      };
      const {
        workloads,
        balanceamento,
        transportesNaoAlocadosIds,
        operadoresDisponiveisIds,
      } = aplicarSimulacaoCompleta(
        state.transportes,
        config,
        state.docas,
        operadores,
      );
      return {
        ...state,
        config,
        operadores,
        workloads,
        balanceamento,
        transportesNaoAlocadosIds,
        operadoresDisponiveisIds,
        workloadPreviewId: workloads[0]?.id ?? null,
        transportePreviewId: null,
      };
    }

    case 'MOVER_TRANSPORTE': {
      const { transporteId, deWorkloadId, paraWorkloadId } = action.payload;
      if (deWorkloadId === paraWorkloadId) return state;

      let workloads = state.workloads.map((w) => {
        if (w.id === deWorkloadId || w.transporteIds.includes(transporteId)) {
          return {
            ...w,
            transporteIds: w.transporteIds.filter((id) => id !== transporteId),
          };
        }
        return w;
      });

      if (paraWorkloadId) {
        workloads = workloads.map((w) => {
          if (w.id !== paraWorkloadId) return w;
          if (w.transporteIds.includes(transporteId)) return w;
          return { ...w, transporteIds: [...w.transporteIds, transporteId] };
        });
      }

      const { workloads: recalculados, balanceamento, transportesNaoAlocadosIds } =
        recalcularEstadoDistribuicao(
          workloads,
          state.operadores,
          state.transportes,
          state.config,
        );

      return {
        ...state,
        workloads: recalculados,
        balanceamento,
        transportesNaoAlocadosIds,
      };
    }

    case 'SET_PREVIEW':
      return {
        ...state,
        workloadPreviewId: action.payload.workloadId,
        transportePreviewId: null,
      };

    default:
      return state;
  }
}

function mapearWorkloadsParaOperadoresReais(
  workloads: EstadoDistribuicao['workloads'],
  operadoresReais: Operador[],
): EstadoDistribuicao['workloads'] {
  const separadores = operadoresReais.filter((o) => o.funcao === 'separador');
  const conferentes = operadoresReais.filter((o) => o.funcao === 'conferente');

  let sepOffset = 0;
  let confOffset = 0;

  return workloads.map((workload) => {
    const sepCount = workload.separadorIds.length;
    const confCount = workload.conferenteIds.length;

    const separadorIds: string[] = [];
    for (let i = 0; i < sepCount && separadores.length > 0; i++) {
      separadorIds.push(separadores[(sepOffset + i) % separadores.length]!.id);
    }
    sepOffset += sepCount;

    const conferenteIds: string[] = [];
    for (let i = 0; i < confCount && conferentes.length > 0; i++) {
      conferenteIds.push(conferentes[(confOffset + i) % conferentes.length]!.id);
    }
    confOffset += confCount;

    return { ...workload, separadorIds, conferenteIds };
  });
}

const ESTADO_VAZO: EstadoDistribuicao = {
  transportes: [],
  config: {
    qtdDocas: 1,
    qtdFuncionarios: 8,
    usarDocasDedicadas: false,
    docasSelecionadasIds: [],
    regrasPorTransportadora: [],
    maxSeparadoresPorWorkload: 4,
    estrategia: 'score_composto',
  },
  docas: [],
  operadores: [],
  workloads: [],
  transportesNaoAlocadosIds: [],
  operadoresDisponiveisIds: [],
  workloadPreviewId: null,
  transportePreviewId: null,
  balanceamento: {
    workloads: [],
    scoreMedio: 0,
    desvioMaximoPercentual: 0,
    scoreGlobalEquilibrio: 0,
  },
};

export function useDistribuicaoSessao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [state, dispatch] = useReducer(reducer, ESTADO_VAZO);
  const [isLoading, setIsLoading] = useState(true);
  const [transporteIdsSelecionados, setTransporteIdsSelecionados] = useState<string[]>(
    [],
  );
  const [isExecutando, setIsExecutando] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!unidadeId) {
      setIsLoading(false);
      return;
    }

    const ids = carregarTransportesSelecionados();
    if (ids.length === 0) {
      setTransporteIdsSelecionados([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setTransporteIdsSelecionados(ids);

    try {
      const dados = await carregarPlanejamentoDistribuicao(unidadeId, ids);
      const transportes = dados.transportes.filter((t) => ids.includes(t.id));

      if (transportes.length === 0) {
        setErrorMessage('Nenhum transporte selecionado encontrado.');
        return;
      }

      dispatch({
        type: 'INIT',
        payload: criarEstadoInicial(transportes, dados.docas, dados.configInicial),
      });
    } catch {
      setErrorMessage('Não foi possível carregar a sessão de distribuição.');
      toast.error('Não foi possível carregar a sessão de distribuição.');
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const temTransportes = state.transportes.length > 0;
  const semSelecao = !isLoading && transporteIdsSelecionados.length === 0;

  const setConfig = useCallback((payload: Partial<ConfigDistribuicao>) => {
    dispatch({ type: 'SET_CONFIG', payload });
  }, []);

  const recalcular = useCallback(() => {
    dispatch({ type: 'RECALCULAR' });
  }, []);

  const simular = useCallback(() => {
    dispatch({ type: 'SIMULAR' });
  }, []);

  const moverTransporte = useCallback(
    (
      transporteId: string,
      deWorkloadId: string | null,
      paraWorkloadId: string | null,
    ) => {
      dispatch({
        type: 'MOVER_TRANSPORTE',
        payload: { transporteId, deWorkloadId, paraWorkloadId },
      });
    },
    [],
  );

  const setPreviewWorkload = useCallback((workloadId: string) => {
    dispatch({
      type: 'SET_PREVIEW',
      payload: { workloadId },
    });
  }, []);

  const confirmarDistribuicao = useCallback(
    async (
      sessaoId: string,
      permitirParcial = false,
    ): Promise<ResultadoExecucaoDistribuicao> => {
      if (!unidadeId) {
        throw new Error('Selecione uma unidade.');
      }

      setIsExecutando(true);
      try {
        const dadosExec = await carregarDadosExecucaoDistribuicao(
          unidadeId,
          sessaoId,
          transporteIdsSelecionados,
        );

        const mapaIndex: MapaIndex = dadosExec.mapaIndex;
        const operadoresReais = dadosExec.operadores;
        const operadoresCarregamento = dadosExec.operadoresCarregamento;

        const workloadsComOperadoresReais = mapearWorkloadsParaOperadoresReais(
          state.workloads,
          operadoresReais,
        );

        const resultado = await executarDistribuicao({
          sessaoId,
          workloads: workloadsComOperadoresReais,
          mapaIndex,
          operadores: operadoresReais,
          operadoresCarregamento,
          transporteIdsAlocados: transporteIdsSelecionados,
          permitirParcial,
        });

        limparTransportesSelecionados();
        return resultado;
      } finally {
        setIsExecutando(false);
      }
    },
    [unidadeId, state.workloads, transporteIdsSelecionados],
  );

  return {
    isLoading,
    isExecutando,
    temTransportes,
    semUnidade: !unidadeId,
    semSelecao,
    transporteIdsSelecionados,
    errorMessage,
    state,
    setConfig,
    recalcular,
    simular,
    moverTransporte,
    setPreviewWorkload,
    confirmarDistribuicao,
    recarregar: carregar,
  };
}

/** @deprecated Use useDistribuicaoSessao */
export const useDistribuicaoMapa = useDistribuicaoSessao;
