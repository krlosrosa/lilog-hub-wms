'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listarDocumentosCobranca } from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import {
  computeDocumentoKpi,
  mapDocumentoParaListItem,
} from '@/features/debito-transportadora/lib/map-documento-cobranca';
import type {
  DocumentoCobrancaListItem,
  FiltroStatusDocumento,
  FiltroTransportadoraDocumento,
} from '@/features/debito-transportadora/types/documento-cobranca.schema';

const PAGE_SIZE = 10;

function filtrarPorTransportadora(
  items: DocumentoCobrancaListItem[],
  filtro: FiltroTransportadoraDocumento,
) {
  if (filtro === 'todas') {
    return items;
  }

  return items.filter((item) => item.transportadora === filtro);
}

function filtrarPorStatus(
  items: DocumentoCobrancaListItem[],
  filtro: FiltroStatusDocumento,
) {
  if (filtro === 'todos') {
    return items;
  }

  return items.filter((item) => item.status === filtro);
}

export function useDocumentoLista() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [documentos, setDocumentos] = useState<DocumentoCobrancaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busca, setBuscaState] = useState('');
  const [filtroTransportadora, setFiltroTransportadoraState] =
    useState<FiltroTransportadoraDocumento>('todas');
  const [filtroStatus, setFiltroStatusState] =
    useState<FiltroStatusDocumento>('todos');
  const [pagina, setPagina] = useState(1);

  const carregarDados = useCallback(async () => {
    if (!unidadeId) {
      setDocumentos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listarDocumentosCobranca(unidadeId);
      setDocumentos(response.documentos.map(mapDocumentoParaListItem));
    } catch (error) {
      setDocumentos([]);

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os documentos de cobrança.';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const kpi = useMemo(() => computeDocumentoKpi(documentos), [documentos]);

  const transportadoraOptions = useMemo(() => {
    const nomes = [...new Set(documentos.map((item) => item.transportadora))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return [
      { value: 'todas' as const, label: 'Todas Transportadoras' },
      ...nomes.map((nome) => ({ value: nome, label: nome })),
    ];
  }, [documentos]);

  const filtrados = useMemo(() => {
    let items = documentos;

    items = filtrarPorTransportadora(items, filtroTransportadora);
    items = filtrarPorStatus(items, filtroStatus);

    const term = busca.trim().toLowerCase();
    if (term) {
      items = items.filter(
        (item) =>
          item.numeroDocumento.toLowerCase().includes(term) ||
          item.transportadora.toLowerCase().includes(term),
      );
    }

    return items;
  }, [documentos, filtroTransportadora, filtroStatus, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const itemsInicio = (paginaSegura - 1) * PAGE_SIZE;
  const itemsPagina = filtrados.slice(itemsInicio, itemsInicio + PAGE_SIZE);

  const setBusca = useCallback((value: string) => {
    setBuscaState(value);
    setPagina(1);
  }, []);

  const setFiltroTransportadora = useCallback(
    (value: FiltroTransportadoraDocumento) => {
      setFiltroTransportadoraState(value);
      setPagina(1);
    },
    [],
  );

  const setFiltroStatus = useCallback((value: FiltroStatusDocumento) => {
    setFiltroStatusState(value);
    setPagina(1);
  }, []);

  return {
    documentos,
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
    totalRegistros: documentos.length,
    pageSize: PAGE_SIZE,
    isLoading,
    transportadoraOptions,
    recarregar: carregarDados,
  };
}
