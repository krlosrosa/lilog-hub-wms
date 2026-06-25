'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import {
  collectPausasFinalizadas,
  fetchPausasSessoes,
} from '@/features/pausas/lib/pausas-data';
import {
  diffMinutes,
  formatDurationMinutes,
  mapToPausaRegistroDetalhe,
} from '@/features/pausas/lib/pausas-mappers';
import { useSessoesDiaPausas } from '@/features/pausas/hooks/use-sessao-ativa-pausas';
import {
  getDefaultRelatorioFiltros,
  TODOS_FUNCIONARIOS,
  type PausaRegistroDetalhe,
  type RelatorioFiltros,
  type RelatorioFooterKpi,
} from '@/features/pausas/types/pausas.schema';

export function usePausasRelatorios() {
  const { sessoes, isLoading: isLoadingSessoes, semUnidade, reload } =
    useSessoesDiaPausas();

  const [isLoading, setIsLoading] = useState(false);
  const [filtros, setFiltros] = useState<RelatorioFiltros>(
    getDefaultRelatorioFiltros,
  );
  const [registros, setRegistros] = useState<PausaRegistroDetalhe[]>([]);
  const [footerKpi, setFooterKpi] = useState<RelatorioFooterKpi>({
    totalPausas: 0,
    mediaPausaPorTurno: '0 min',
    pausasTermicasMinutos: 0,
    pausasRefeicaoMinutos: 0,
  });
  const [funcionariosDisponiveis, setFuncionariosDisponiveis] = useState<
    string[]
  >([TODOS_FUNCIONARIOS]);

  const loadRegistros = useCallback(async () => {
    if (semUnidade || sessoes.length === 0) {
      setRegistros([]);
      setFooterKpi({
        totalPausas: 0,
        mediaPausaPorTurno: '0 min',
        pausasTermicasMinutos: 0,
        pausasRefeicaoMinutos: 0,
      });
      setFuncionariosDisponiveis([TODOS_FUNCIONARIOS]);
      return;
    }

    setIsLoading(true);

    try {
      const sessoesFiltradas = sessoes.filter(
        (s) => s.dataReferencia === filtros.dataReferencia,
      );
      const dadosSessoes = await fetchPausasSessoes(sessoesFiltradas);

      const pausasRaw = dadosSessoes.flatMap(({ sessao, dados }) =>
        collectPausasFinalizadas(dados).map(({ funcionario, pausa }) => ({
          sessao,
          funcionario,
          pausa,
          detalhe: mapToPausaRegistroDetalhe(
            funcionario,
            pausa,
            sessao.equipeNome,
          ),
        })),
      );

      const nomes = [
        TODOS_FUNCIONARIOS,
        ...new Set(pausasRaw.map((r) => r.detalhe.funcionario)),
      ].sort((a, b) => {
        if (a === TODOS_FUNCIONARIOS) return -1;
        if (b === TODOS_FUNCIONARIOS) return 1;
        return a.localeCompare(b, 'pt-BR');
      });

      setFuncionariosDisponiveis(nomes);

      let items = pausasRaw.map((r) => r.detalhe);
      if (filtros.funcionario !== TODOS_FUNCIONARIOS) {
        items = items.filter((r) => r.funcionario === filtros.funcionario);
      }

      setRegistros(items);

      const termicaMin = pausasRaw
        .filter((r) => r.pausa.tipo === 'termica' && r.pausa.fim)
        .reduce(
          (acc, r) => acc + diffMinutes(r.pausa.inicio, r.pausa.fim!),
          0,
        );

      const refeicaoMin = pausasRaw
        .filter((r) => r.pausa.tipo === 'refeicao' && r.pausa.fim)
        .reduce(
          (acc, r) => acc + diffMinutes(r.pausa.inicio, r.pausa.fim!),
          0,
        );

      const totalMin = pausasRaw.reduce(
        (acc, r) =>
          r.pausa.fim
            ? acc + diffMinutes(r.pausa.inicio, r.pausa.fim)
            : acc,
        0,
      );

      const media =
        pausasRaw.length > 0
          ? Math.round(totalMin / pausasRaw.length)
          : 0;

      setFooterKpi({
        totalPausas: pausasRaw.length,
        mediaPausaPorTurno: formatDurationMinutes(media),
        pausasTermicasMinutos: termicaMin,
        pausasRefeicaoMinutos: refeicaoMin,
      });
    } catch {
      toast.error('Não foi possível carregar os relatórios de pausas.');
      setRegistros([]);
    } finally {
      setIsLoading(false);
    }
  }, [semUnidade, sessoes, filtros]);

  useEffect(() => {
    void loadRegistros();
  }, [loadRegistros]);

  const setDataReferencia = useCallback((dataReferencia: string) => {
    setFiltros((current) => ({ ...current, dataReferencia }));
  }, []);

  const setFuncionario = useCallback((funcionario: string) => {
    setFiltros((current) => ({ ...current, funcionario }));
  }, []);

  const aplicarFiltros = useCallback(async () => {
    await loadRegistros();
    return { success: true as const };
  }, [loadRegistros]);

  const resumoPorTipo = useMemo(() => {
    const termica = registros.filter((r) => r.tipo === 'termica').length;
    const refeicao = registros.filter((r) => r.tipo === 'refeicao').length;
    const outros = registros.filter((r) => r.tipo === 'outros').length;
    const total = registros.length || 1;
    return [
      { tipo: 'Térmica', count: termica, percent: Math.round((termica / total) * 100) },
      { tipo: 'Refeição', count: refeicao, percent: Math.round((refeicao / total) * 100) },
      { tipo: 'Outros', count: outros, percent: Math.round((outros / total) * 100) },
    ];
  }, [registros]);

  return {
    isLoading: isLoadingSessoes || isLoading,
    filtros,
    setDataReferencia,
    setFuncionario,
    aplicarFiltros,
    registros,
    resumoPorTipo,
    footerKpi,
    totalRegistros: registros.length,
    funcionariosDisponiveis,
    semUnidade,
    reload,
  };
}
