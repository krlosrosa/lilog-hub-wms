'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { carregarPlanejamentoDistribuicao } from '@/features/distribuicao-demandas/lib/distribuicao-data-loader';
import { calcularResumoPlanejamento } from '@/features/distribuicao-demandas/lib/map-distribuicao-data';
import { salvarTransportesSelecionados } from '@/features/distribuicao-demandas/lib/transportes-selecao';
import type {
  ResumoPlanejamento,
  TransporteExpedicao,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export function usePlanejamentoDashboard() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;
  const unidadeNome = unidadeSelecionada?.nome ?? null;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [transportes, setTransportes] = useState<TransporteExpedicao[]>([]);
  const [resumo, setResumo] = useState<ResumoPlanejamento | null>(null);
  const [expandedTransporteIds, setExpandedTransporteIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTransporteIds, setSelectedTransporteIds] = useState<Set<string>>(
    new Set(),
  );
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('todas');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const carregarTransportes = useCallback(async () => {
    if (!unidadeId) {
      setTransportes([]);
      setResumo(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const dados = await carregarPlanejamentoDistribuicao(unidadeId);
      setTransportes(dados.transportes);
      setResumo(calcularResumoPlanejamento(dados.transportes, dados.docas));
      setSelectedTransporteIds(new Set());
    } catch {
      setTransportes([]);
      setResumo(null);
      setErrorMessage('Não foi possível carregar os transportes pendentes.');
      toast.error('Não foi possível carregar os transportes pendentes.');
    } finally {
      setIsLoading(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    void carregarTransportes();
  }, [carregarTransportes]);

  const empresasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const t of transportes) {
      if (t.empresa && t.empresa !== 'Multi') set.add(t.empresa);
      for (const m of t.mapas) {
        if (m.empresa && m.empresa !== '—') set.add(m.empresa);
      }
    }
    return [...set].sort();
  }, [transportes]);

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const t of transportes) {
      for (const c of t.categorias) {
        if (c && c !== '—') set.add(c);
      }
    }
    return [...set].sort();
  }, [transportes]);

  const transportesFiltrados = useMemo(() => {
    return transportes.filter((t) => {
      const matchEmpresa =
        filtroEmpresa === 'todas' ||
        t.empresa === filtroEmpresa ||
        t.mapas.some((m) => m.empresa === filtroEmpresa);
      const matchCategoria =
        filtroCategoria === 'todas' ||
        t.categorias.includes(filtroCategoria) ||
        t.mapas.some((m) => m.categoria === filtroCategoria);
      return matchEmpresa && matchCategoria;
    });
  }, [transportes, filtroEmpresa, filtroCategoria]);

  const transportesSelecionaveis = useMemo(
    () => transportesFiltrados.filter((t) => t.temMapaGerado),
    [transportesFiltrados],
  );

  const toggleExpand = useCallback((transporteId: string) => {
    setExpandedTransporteIds((prev) => {
      const next = new Set(prev);
      if (next.has(transporteId)) {
        next.delete(transporteId);
      } else {
        next.add(transporteId);
      }
      return next;
    });
  }, []);

  const toggleSelect = useCallback((transporteId: string) => {
    setSelectedTransporteIds((prev) => {
      const next = new Set(prev);
      if (next.has(transporteId)) {
        next.delete(transporteId);
      } else {
        next.add(transporteId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedTransporteIds((prev) => {
      const ids = transportesSelecionaveis.map((t) => t.id);
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  }, [transportesSelecionaveis]);

  const iniciarDistribuicao = useCallback(() => {
    const ids = [...selectedTransporteIds];
    if (ids.length === 0) {
      toast.error('Selecione ao menos um transporte com mapa gerado.');
      return;
    }

    salvarTransportesSelecionados(ids);
    router.push('/op-wms/distribuicao-demandas/sessao');
  }, [selectedTransporteIds, router]);

  return {
    isLoading,
    transportes: transportesFiltrados,
    resumo,
    expandedTransporteIds,
    selectedTransporteIds,
    toggleExpand,
    toggleSelect,
    toggleSelectAll,
    iniciarDistribuicao,
    unidadeNome,
    semUnidade: !unidadeId,
    reloadTransportes: carregarTransportes,
    errorMessage,
    filtroEmpresa,
    setFiltroEmpresa,
    filtroCategoria,
    setFiltroCategoria,
    empresasDisponiveis,
    categoriasDisponiveis,
    podeDistribuir: selectedTransporteIds.size > 0,
    qtdSelecionados: selectedTransporteIds.size,
    transportesSelecionaveis,
  };
}
