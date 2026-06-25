'use client';

import { useCallback, useMemo, useState } from 'react';

import type {
  RelatorioDownloadStatus,
  RelatorioFiltros,
  RelatorioItem,
  RelatorioTab,
} from '@/features/devolucao/types/devolucao-relatorios.schema';
import { DEFAULT_RELATORIO_FILTROS } from '@/features/devolucao/types/devolucao-relatorios.schema';

const MOCK_RELATORIOS: RelatorioItem[] = [
  {
    id: 'contagem-fisica',
    title: 'Contagem Física',
    description:
      'Relatório detalhado contendo todas as informações de contagem física originadas de demandas ativas e encerradas. Crucial para auditorias de estoque e verificação de integridade de SKU por zona de armazenamento.',
    badge: 'Relatório Full',
    lastUpdated: 'Hoje, 08:45',
    recordCount: '12k SKU',
    variant: 'primary',
    layout: 'full',
    isFavorite: true,
    isRecent: true,
  },
  {
    id: 'notas-fiscais',
    title: 'Notas Fiscais',
    description:
      'Exportação consolidada de todas as NFs registradas no sistema. Inclui detalhes tributários, status de conferência, valores e chaves de acesso.',
    recordCount: '3,450 registros este mês',
    variant: 'secondary',
    layout: 'half',
    isFavorite: true,
    isRecent: false,
  },
  {
    id: 'anomalias',
    title: 'Anomalias',
    description:
      'Relatório crítico de divergências encontradas durante o processo de conferência. Essencial para controle de perdas e gestão de fornecedores.',
    alertText: '12 novas anomalias hoje',
    variant: 'destructive',
    layout: 'half',
    isFavorite: true,
    isRecent: true,
  },
];

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useDevolucaoRelatorios() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<RelatorioTab>('favoritos');
  const [filtros, setFiltros] = useState<RelatorioFiltros>(
    DEFAULT_RELATORIO_FILTROS,
  );
  const [downloadStatus, setDownloadStatus] = useState<
    Record<string, RelatorioDownloadStatus>
  >({});

  const relatorios = useMemo(() => {
    if (activeTab === 'favoritos') {
      return MOCK_RELATORIOS.filter((item) => item.isFavorite);
    }

    if (activeTab === 'recentes') {
      return MOCK_RELATORIOS.filter((item) => item.isRecent);
    }

    return MOCK_RELATORIOS;
  }, [activeTab]);

  const setPeriodo = useCallback((periodo: RelatorioFiltros['periodo']) => {
    setFiltros((current) => ({ ...current, periodo }));
  }, []);

  const setUnidade = useCallback((unidade: RelatorioFiltros['unidade']) => {
    setFiltros((current) => ({ ...current, unidade }));
  }, []);

  const setStatus = useCallback((status: RelatorioFiltros['status']) => {
    setFiltros((current) => ({ ...current, status }));
  }, []);

  const refreshResults = useCallback(async () => {
    setIsRefreshing(true);
    await delay(900);
    setIsRefreshing(false);
    return { success: true as const };
  }, []);

  const downloadReport = useCallback(async (reportId: string) => {
    setDownloadStatus((current) => ({ ...current, [reportId]: 'loading' }));
    await delay(1500);
    setDownloadStatus((current) => ({ ...current, [reportId]: 'success' }));
    await delay(2000);
    setDownloadStatus((current) => ({ ...current, [reportId]: 'idle' }));
    return { success: true as const };
  }, []);

  const getDownloadStatus = useCallback(
    (reportId: string): RelatorioDownloadStatus =>
      downloadStatus[reportId] ?? 'idle',
    [downloadStatus],
  );

  return {
    isRefreshing,
    activeTab,
    setActiveTab,
    filtros,
    setPeriodo,
    setUnidade,
    setStatus,
    relatorios,
    refreshResults,
    downloadReport,
    getDownloadStatus,
  };
}
