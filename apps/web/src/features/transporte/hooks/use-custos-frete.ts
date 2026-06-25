'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  MOCK_CUSTO_FRETE_ITEMS,
  montarCustoFreteItems,
} from '@/features/transporte/mocks/custo-frete.mock';
import { calcularCustoFreteSummary } from '@/features/transporte/lib/calcular-custo-frete';
import type {
  CustoFreteItem,
  CustoFreteRealizado,
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

function filtrarPorData(items: CustoFreteItem[], data: string): CustoFreteItem[] {
  if (!data.trim()) {
    return items;
  }

  return items.filter((item) => item.transporte.dataTransporte === data);
}

function filtrarPorVariacao(
  items: CustoFreteItem[],
  maiorQue: string,
  menorQue: string,
): CustoFreteItem[] {
  const min = maiorQue.trim() ? Number.parseFloat(maiorQue) : null;
  const max = menorQue.trim() ? Number.parseFloat(menorQue) : null;

  if (min == null && max == null) {
    return items;
  }

  return items.filter((item) => {
    const variacao = item.variacaoValor;

    if (min != null && variacao <= min) {
      return false;
    }

    if (max != null && variacao >= max) {
      return false;
    }

    return true;
  });
}

export function useCustosFrete() {
  const [custosFrete, setCustosFrete] = useState<CustoFreteRealizado[]>(() =>
    MOCK_CUSTO_FRETE_ITEMS.map((item) => item.custoFrete),
  );
  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatusCustoFrete>('todos');
  const [filtroTransportadora, setFiltroTransportadora] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [filtroValorMaiorQue, setFiltroValorMaiorQue] = useState('');
  const [filtroValorMenorQue, setFiltroValorMenorQue] = useState('');

  const items = useMemo(
    () => montarCustoFreteItems(custosFrete),
    [custosFrete],
  );

  const transportadoras = useMemo(() => {
    const nomes = items
      .map((item) => item.transporte.veiculoAlocado?.transportadora)
      .filter((nome): nome is string => Boolean(nome));

    return [...new Set(nomes)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [items]);

  const filtrados = useMemo(() => {
    let resultado = items;
    resultado = filtrarPorStatus(resultado, filtroStatus);
    resultado = filtrarPorTransportadora(resultado, filtroTransportadora);
    resultado = filtrarPorData(resultado, filtroData);
    resultado = filtrarPorVariacao(
      resultado,
      filtroValorMaiorQue,
      filtroValorMenorQue,
    );
    return resultado;
  }, [
    items,
    filtroStatus,
    filtroTransportadora,
    filtroData,
    filtroValorMaiorQue,
    filtroValorMenorQue,
  ]);

  const summary = useMemo(
    () => calcularCustoFreteSummary(filtrados),
    [filtrados],
  );

  const atualizarCustoFrete = useCallback((atualizado: CustoFreteRealizado) => {
    setCustosFrete((prev) =>
      prev.map((item) => (item.id === atualizado.id ? atualizado : item)),
    );
  }, []);

  return {
    items: filtrados,
    summary,
    transportadoras,
    filtroStatus,
    setFiltroStatus,
    filtroTransportadora,
    setFiltroTransportadora,
    filtroData,
    setFiltroData,
    filtroValorMaiorQue,
    setFiltroValorMaiorQue,
    filtroValorMenorQue,
    setFiltroValorMenorQue,
    atualizarCustoFrete,
  };
}
