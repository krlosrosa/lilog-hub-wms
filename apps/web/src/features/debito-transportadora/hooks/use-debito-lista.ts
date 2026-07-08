'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  listarDocumentosCobranca,
  listarProcessosDebito,
} from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import {
  computeDebitoKpi,
  mapProcessoParaOcorrencia,
} from '@/features/debito-transportadora/lib/map-processo-debito';
import type {
  DebitoKpi,
  DebitoOcorrencia,
  FiltroStatusDebito,
  FiltroTransportadora,
} from '@/features/debito-transportadora/types/debito.schema';

const PAGE_SIZE = 10;

const EMPTY_KPI: DebitoKpi = {
  prejuizoTotalAberto: 0,
  prejuizoVariacaoPercentual: 0,
  cobrancasEmDisputa: 0,
  casosAtivosDisputa: 0,
  taxaRecuperacao: 0,
  metaRecuperacao: 85,
  topOfensores: [],
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function filtrarPorTransportadora(
  items: DebitoOcorrencia[],
  filtro: FiltroTransportadora,
): DebitoOcorrencia[] {
  if (filtro === 'todas') {
    return items;
  }

  return items.filter((item) => item.transportadora === filtro);
}

function filtrarPorStatus(
  items: DebitoOcorrencia[],
  filtro: FiltroStatusDebito,
): DebitoOcorrencia[] {
  if (filtro === 'todos') {
    return items;
  }

  return items.filter((item) => item.status === filtro);
}

export function useDebitoLista() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [ocorrencias, setOcorrencias] = useState<DebitoOcorrencia[]>([]);
  const [kpi, setKpi] = useState<DebitoKpi>(EMPTY_KPI);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBuscaState] = useState('');
  const [filtroTransportadora, setFiltroTransportadoraState] =
    useState<FiltroTransportadora>('todas');
  const [filtroStatus, setFiltroStatusState] =
    useState<FiltroStatusDebito>('todos');
  const [pagina, setPagina] = useState(1);
  const [exportando, setExportando] = useState(false);
  const [conciliando, setConciliando] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!unidadeId) {
      setOcorrencias([]);
      setKpi(EMPTY_KPI);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [processosResponse, documentosResponse] = await Promise.all([
        listarProcessosDebito(unidadeId),
        listarDocumentosCobranca(unidadeId),
      ]);

      const ocorrenciasMapeadas = processosResponse.processos.map(
        mapProcessoParaOcorrencia,
      );

      setOcorrencias(ocorrenciasMapeadas);
      setKpi(
        computeDebitoKpi(
          processosResponse.processos,
          documentosResponse.documentos,
        ),
      );
    } catch (error) {
      setOcorrencias([]);
      setKpi(EMPTY_KPI);

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os processos de débito.';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const transportadoraOptions = useMemo(() => {
    const nomes = [...new Set(ocorrencias.map((item) => item.transportadora))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return [
      { value: 'todas' as const, label: 'Todas Transportadoras' },
      ...nomes.map((nome) => ({ value: nome, label: nome })),
    ];
  }, [ocorrencias]);

  const filtrados = useMemo(() => {
    let items = ocorrencias;

    items = filtrarPorTransportadora(items, filtroTransportadora);
    items = filtrarPorStatus(items, filtroStatus);

    const term = busca.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (item) =>
          item.protocolo.toLowerCase().includes(term) ||
          item.transportadora.toLowerCase().includes(term) ||
          item.nfOrigem.toLowerCase().includes(term),
      );
    }

    return items;
  }, [ocorrencias, filtroTransportadora, filtroStatus, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * PAGE_SIZE;
  const itemsPagina = filtrados.slice(itemsInicio, itemsInicio + PAGE_SIZE);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const setFiltroTransportadora = useCallback((value: FiltroTransportadora) => {
    setFiltroTransportadoraState(value);
    setPagina(1);
  }, []);

  const setFiltroStatus = useCallback((value: FiltroStatusDebito) => {
    setFiltroStatusState(value);
    setPagina(1);
  }, []);

  const filtrosAvancados = useCallback(() => {
    toast.info('Filtros avançados em construção (mock)', { duration: 2500 });
  }, []);

  const exportar = useCallback(async () => {
    setExportando(true);
    try {
      await delay(600);
      toast.success('Relatório exportado (mock)', {
        description: 'O arquivo será disponibilizado em instantes.',
      });
    } finally {
      setExportando(false);
    }
  }, []);

  const forcarConciliacao = useCallback(async () => {
    setConciliando(true);
    try {
      await delay(800);
      toast.success('Conciliação TMS/Freight iniciada (mock)');
    } finally {
      setConciliando(false);
    }
  }, []);

  return {
    kpi,
    busca,
    setBusca,
    filtroTransportadora,
    setFiltroTransportadora,
    filtroStatus,
    setFiltroStatus,
    pagina: paginaSegura,
    setPagina,
    totalPaginas,
    itemsPagina,
    itemsInicio,
    totalFiltrados: filtrados.length,
    totalRegistros: ocorrencias.length,
    pageSize: PAGE_SIZE,
    exportando,
    conciliando,
    isLoading,
    transportadoraOptions,
    ocorrencias,
    recarregar: carregarDados,
    actions: {
      filtrosAvancados,
      exportar,
      forcarConciliacao,
    },
  };
}
