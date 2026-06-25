'use client';

import { useMemo, useState } from 'react';

import {
  calcularCustoFreteInsights,
  calcularCustoFreteSummary,
  calcularDadosGraficos,
  calcularIndicadoresTransporte,
  calcularRankingTipoAdicional,
  calcularRankingTransportadora,
} from '@/features/transporte/lib/calcular-custo-frete';
import { MOCK_CUSTO_FRETE_ITEMS } from '@/features/transporte/mocks/custo-frete.mock';
import type {
  CustoFreteItem,
  FiltroStatusCustoFrete,
} from '@/features/transporte/types/transporte.schema';

function filtrarPorStatus(
  items: CustoFreteItem[],
  filtro: FiltroStatusCustoFrete,
): CustoFreteItem[] {
  if (filtro === 'todos') {
    return items;
  }

  return items.filter((item) => item.custoFrete.status === filtro);
}

function filtrarPorTransportadora(
  items: CustoFreteItem[],
  transportadora: string,
): CustoFreteItem[] {
  if (!transportadora.trim()) {
    return items;
  }

  return items.filter(
    (item) =>
      item.transporte.veiculoAlocado?.transportadora.toLowerCase() ===
      transportadora.toLowerCase(),
  );
}

function filtrarPorRota(items: CustoFreteItem[], rota: string): CustoFreteItem[] {
  if (!rota.trim()) {
    return items;
  }

  return items.filter((item) => item.transporte.rota === rota);
}

function filtrarPorData(items: CustoFreteItem[], data: string): CustoFreteItem[] {
  if (!data.trim()) {
    return items;
  }

  return items.filter((item) => item.transporte.dataTransporte === data);
}

export function useCustoFreteDashboard() {
  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatusCustoFrete>('todos');
  const [filtroTransportadora, setFiltroTransportadora] = useState('');
  const [filtroRota, setFiltroRota] = useState('');
  const [filtroData, setFiltroData] = useState('');

  const items = MOCK_CUSTO_FRETE_ITEMS;

  const transportadoras = useMemo(() => {
    const nomes = items
      .map((item) => item.transporte.veiculoAlocado?.transportadora)
      .filter((nome): nome is string => Boolean(nome));

    return [...new Set(nomes)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [items]);

  const rotas = useMemo(() => {
    const nomes = items.map((item) => item.transporte.rota);
    return [...new Set(nomes)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [items]);

  const filtrados = useMemo(() => {
    let resultado = items;
    resultado = filtrarPorStatus(resultado, filtroStatus);
    resultado = filtrarPorTransportadora(resultado, filtroTransportadora);
    resultado = filtrarPorRota(resultado, filtroRota);
    resultado = filtrarPorData(resultado, filtroData);
    return resultado;
  }, [items, filtroStatus, filtroTransportadora, filtroRota, filtroData]);

  const summary = useMemo(
    () => calcularCustoFreteSummary(filtrados),
    [filtrados],
  );

  const insights = useMemo(
    () => calcularCustoFreteInsights(filtrados),
    [filtrados],
  );

  const indicadores = useMemo(
    () => calcularIndicadoresTransporte(filtrados),
    [filtrados],
  );

  const rankingTransportadora = useMemo(
    () => calcularRankingTransportadora(filtrados),
    [filtrados],
  );

  const rankingAdicional = useMemo(
    () => calcularRankingTipoAdicional(filtrados),
    [filtrados],
  );

  const graficos = useMemo(
    () => calcularDadosGraficos(filtrados),
    [filtrados],
  );

  const filtrosAtivos = [
    filtroStatus !== 'todos',
    Boolean(filtroTransportadora),
    Boolean(filtroRota),
    Boolean(filtroData),
  ].filter(Boolean).length;

  const limparFiltros = () => {
    setFiltroStatus('todos');
    setFiltroTransportadora('');
    setFiltroRota('');
    setFiltroData('');
  };

  return {
    filtrados,
    summary,
    insights,
    indicadores,
    graficos,
    rankingTransportadora,
    rankingAdicional,
    filtrosAtivos,
    limparFiltros,
    transportadoras,
    rotas,
    filtroStatus,
    setFiltroStatus,
    filtroTransportadora,
    setFiltroTransportadora,
    filtroRota,
    setFiltroRota,
    filtroData,
    setFiltroData,
  };
}
