'use client';

import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  MOCK_ALERTAS_CRITICOS,
  MOCK_HEAT_CELLS,
  MOCK_RUA_METRICAS,
} from '@/features/enderecos/mocks/enderecos-detail-mock-data';
import type {
  HeatCell,
  MapaCalorTab,
} from '@/features/enderecos/types/enderecos-mapa-calor.schema';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useEnderecosMapaCalor() {
  const [isLoading, setIsLoading] = useState(false);
  const [tabAtiva, setTabAtiva] = useState<MapaCalorTab>('ocupacao');
  const [ruaSelecionada, setRuaSelecionada] = useState('A');
  const [celulaSelecionada, setCelulaSelecionada] = useState<string | null>(
    null,
  );
  const [cells] = useState<HeatCell[]>(() => [...MOCK_HEAT_CELLS]);
  const [alertas] = useState(() => [...MOCK_ALERTAS_CRITICOS]);

  const ruas = useMemo(() => {
    const map = new Map<string, HeatCell[]>();
    for (const cell of cells) {
      const list = map.get(cell.rua) ?? [];
      list.push(cell);
      map.set(cell.rua, list);
    }
    return map;
  }, [cells]);

  const metricas = useMemo(() => {
    const key = ruaSelecionada as keyof typeof MOCK_RUA_METRICAS;
    return MOCK_RUA_METRICAS[key] ?? MOCK_RUA_METRICAS.A;
  }, [ruaSelecionada]);

  const selecionarCelula = useCallback((cell: HeatCell) => {
    setCelulaSelecionada(cell.id);
    setRuaSelecionada(cell.rua);
  }, []);

  const exportarPdf = useCallback(async () => {
    setIsLoading(true);
    try {
      await delay(800);
      toast.success('PDF consolidado gerado (mock)');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportarCsv = useCallback(async () => {
    setIsLoading(true);
    try {
      await delay(600);
      toast.success('CSV bruto exportado (mock)');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verTodosAlertas = useCallback(() => {
    toast.info('Lista completa de alertas em construção (mock)');
  }, []);

  return {
    isLoading,
    tabAtiva,
    setTabAtiva,
    ruas,
    ruaSelecionada,
    celulaSelecionada,
    metricas,
    alertas,
    selecionarCelula,
    exportarPdf,
    exportarCsv,
    verTodosAlertas,
  };
}
