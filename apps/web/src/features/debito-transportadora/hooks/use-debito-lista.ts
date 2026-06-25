'use client';

import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  MOCK_DEBITO_KPI,
  MOCK_DEBITO_OCORRENCIAS,
} from '@/features/debito-transportadora/mocks/debitos-mock-data';
import type {
  DebitoOcorrencia,
  FiltroStatusDebito,
  FiltroTransportadora,
} from '@/features/debito-transportadora/types/debito.schema';

const PAGE_SIZE = 10;
const TOTAL_MOCK = 1_240;

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

  const mapa: Record<Exclude<FiltroTransportadora, 'todas'>, string> = {
    swift_logistics: 'Swift Logistics',
    global_freight: 'Global Freight',
    rapid_way: 'Rapid Way',
  };

  const alvo = mapa[filtro];
  return items.filter((item) => item.transportadora === alvo);
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
  const [ocorrencias] = useState<DebitoOcorrencia[]>(() => [
    ...MOCK_DEBITO_OCORRENCIAS,
  ]);
  const [busca, setBuscaState] = useState('');
  const [filtroTransportadora, setFiltroTransportadoraState] =
    useState<FiltroTransportadora>('todas');
  const [filtroStatus, setFiltroStatusState] =
    useState<FiltroStatusDebito>('todos');
  const [pagina, setPagina] = useState(1);
  const [exportando, setExportando] = useState(false);
  const [conciliando, setConciliando] = useState(false);

  const kpi = MOCK_DEBITO_KPI;

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

  const gerarCartaDebito = useCallback(async () => {
    await delay(400);
    toast.success('Carta de débito gerada (mock)', {
      description: 'Documento conforme padrão regulatório SEFAZ v4.0.',
    });
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
    totalRegistros: TOTAL_MOCK,
    pageSize: PAGE_SIZE,
    exportando,
    conciliando,
    actions: {
      filtrosAvancados,
      exportar,
      gerarCartaDebito,
      forcarConciliacao,
    },
  };
}
