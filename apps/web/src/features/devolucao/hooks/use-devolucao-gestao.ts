'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { ApiClientError } from '@/lib/api';
import { useUnidadeContext } from '@/contexts/unidade-context';

import {
  atualizarStatusDemanda,
  criarGrupoDescargaDevolucao,
  listarDemandasDevolucao,
  listarGruposDescargaDevolucao,
} from '@/features/devolucao/lib/devolucao-api';
import type {
  DemandaDevolucaoFiltroStatus,
  DemandaDevolucaoListItem,
  DemandaDevolucaoStatus,
  DevolucaoGestaoStats,
} from '@/features/devolucao/types/devolucao-gestao.schema';
import type { GrupoDescargaListItem } from '@/features/devolucao/types/devolucao-grupo-descarga.schema';
import { canAgruparDemanda } from '@/features/devolucao/types/devolucao-grupo-descarga.schema';
import {
  canConcluirDemanda,
  canIniciarAnalise,
  canIniciarExecucao,
  computePesoPorStatus,
  countDemandasPorTipoNf,
} from '@/features/devolucao/types/devolucao-gestao.schema';

const EMPTY_STATS: DevolucaoGestaoStats = {
  total: 0,
  rascunho: 0,
  aberta: 0,
  emAnalise: 0,
  emExecucao: 0,
  conferida: 0,
  concluida: 0,
  cancelada: 0,
};

export function useDevolucaoGestao() {
  const { unidadeSelecionada } = useUnidadeContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [busca, setBuscaState] = useState('');
  const [filtroStatus, setFiltroStatusState] =
    useState<DemandaDevolucaoFiltroStatus>('todos');
  const [demandas, setDemandas] = useState<DemandaDevolucaoListItem[]>([]);
  const [grupos, setGrupos] = useState<GrupoDescargaListItem[]>([]);
  const [stats, setStats] = useState<DevolucaoGestaoStats>(EMPTY_STATS);
  const [incluirManualOpen, setIncluirManualOpen] = useState(false);
  const [criarGrupoOpen, setCriarGrupoOpen] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'demandas' | 'grupos'>('demandas');
  const [demandasSelecionadas, setDemandasSelecionadas] = useState<Set<string>>(
    () => new Set(),
  );

  const unidadeId = unidadeSelecionada?.id ?? null;

  const carregarDemandas = useCallback(async () => {
    if (!unidadeId) {
      setDemandas([]);
      setGrupos([]);
      setStats(EMPTY_STATS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [demandasResponse, gruposResponse] = await Promise.all([
        listarDemandasDevolucao(unidadeId),
        listarGruposDescargaDevolucao(unidadeId),
      ]);
      setDemandas(demandasResponse.demandas);
      setStats(demandasResponse.stats);
      setGrupos(gruposResponse.grupos);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar as demandas de devolução.';
      toast.error(message);
      setDemandas([]);
      setGrupos([]);
      setStats(EMPTY_STATS);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void carregarDemandas();
  }, [carregarDemandas]);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
  }, []);

  const setFiltroStatus = useCallback((value: DemandaDevolucaoFiltroStatus) => {
    setFiltroStatusState(value);
  }, []);

  const demandasFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();

    return demandas.filter((demanda) => {
      if (filtroStatus !== 'todos' && demanda.status !== filtroStatus) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        demanda.codigoDemanda.toLowerCase().includes(term) ||
        (demanda.transporteId?.toLowerCase().includes(term) ?? false) ||
        (demanda.placa?.toLowerCase().includes(term) ?? false) ||
        (demanda.cliente?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [demandas, busca, filtroStatus]);

  const pesoPorStatus = useMemo(
    () => computePesoPorStatus(demandas),
    [demandas],
  );

  const tiposNfCounts = useMemo(
    () => countDemandasPorTipoNf(demandas),
    [demandas],
  );

  const avancarStatus = useCallback(
    async (demandaId: string, statusAtual: DemandaDevolucaoStatus) => {
      if (!unidadeId) {
        return { success: false as const };
      }

      let proximoStatus: DemandaDevolucaoStatus | null = null;

      if (canIniciarAnalise(statusAtual)) {
        proximoStatus = 'em_analise';
      } else if (canIniciarExecucao(statusAtual)) {
        proximoStatus = 'em_execucao';
      } else if (canConcluirDemanda(statusAtual)) {
        proximoStatus = 'concluida';
      }

      if (!proximoStatus) {
        return { success: false as const };
      }

      setIsUpdating(true);

      try {
        await atualizarStatusDemanda(demandaId, unidadeId, {
          status: proximoStatus,
        });
        toast.success('Status da demanda atualizado.');
        await carregarDemandas();
        return { success: true as const };
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível atualizar o status da demanda.';
        toast.error(message);
        return { success: false as const };
      } finally {
        setIsUpdating(false);
      }
    },
    [unidadeId, carregarDemandas],
  );

  const openIncluirManual = useCallback(() => {
    setIncluirManualOpen(true);
  }, []);

  const closeIncluirManual = useCallback(() => {
    setIncluirManualOpen(false);
  }, []);

  const demandasElegiveisAgrupamento = useMemo(
    () =>
      demandas.filter((demanda) =>
        canAgruparDemanda(
          demanda.status,
          demanda.grupoDescargaId ?? null,
        ),
      ),
    [demandas],
  );

  const demandasSelecionadasLista = useMemo(
    () => demandas.filter((demanda) => demandasSelecionadas.has(demanda.id)),
    [demandas, demandasSelecionadas],
  );

  const toggleDemandaSelecionada = useCallback((demandaId: string) => {
    setDemandasSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(demandaId)) {
        next.delete(demandaId);
      } else {
        next.add(demandaId);
      }
      return next;
    });
  }, []);

  const openCriarGrupo = useCallback(() => {
    if (demandasSelecionadas.size < 1) return;
    setCriarGrupoOpen(true);
  }, [demandasSelecionadas.size]);

  const closeCriarGrupo = useCallback(() => {
    setCriarGrupoOpen(false);
  }, []);

  const criarGrupoDescarga = useCallback(
    async (values: {
      placaDescarga: string;
      doca: string;
      cargaSegregada: boolean;
      paletesEsperados: number | null;
      observacao: string;
      liberarConferencia: boolean;
    }) => {
      if (!unidadeId || demandasSelecionadas.size < 1) {
        return { success: false as const };
      }

      setIsUpdating(true);
      try {
        const result = await criarGrupoDescargaDevolucao({
          unidadeId,
          demandaIds: [...demandasSelecionadas],
          placaDescarga: values.placaDescarga,
          doca: values.doca || null,
          cargaSegregada: values.cargaSegregada,
          paletesEsperados: values.paletesEsperados,
          observacao: values.observacao || null,
          liberarConferencia: values.liberarConferencia,
        });

        toast.success(`Grupo ${result.codigoGrupo} criado com sucesso.`);
        setDemandasSelecionadas(new Set());
        setCriarGrupoOpen(false);
        setAbaAtiva('grupos');
        await carregarDemandas();
        return { success: true as const, grupoId: result.id };
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível criar o grupo de descarga.';
        toast.error(message);
        return { success: false as const };
      } finally {
        setIsUpdating(false);
      }
    },
    [carregarDemandas, demandasSelecionadas, unidadeId],
  );

  const onDemandaIncluida = useCallback(async () => {
    await carregarDemandas();
  }, [carregarDemandas]);

  return {
    isLoading,
    isUpdating,
    stats,
    pesoPorStatus,
    demandas: demandasFiltradas,
    grupos,
    tiposNfCounts,
    busca,
    setBusca,
    filtroStatus,
    setFiltroStatus,
    avancarStatus,
    recarregar: carregarDemandas,
    unidadeId,
    incluirManualOpen,
    openIncluirManual,
    closeIncluirManual,
    onDemandaIncluida,
    abaAtiva,
    setAbaAtiva,
    demandasSelecionadas,
    toggleDemandaSelecionada,
    demandasElegiveisAgrupamento,
    demandasSelecionadasLista,
    criarGrupoOpen,
    openCriarGrupo,
    closeCriarGrupo,
    criarGrupoDescarga,
  };
}
