'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toast } from 'sonner';

import { ApiClientError } from '@/lib/api';
import {
  computeMonitorStats,
  mapToOperadorEmPausa,
} from '@/features/pausas/lib/pausas-mappers';
import {
  fetchPausasPorFuncionarios,
  sumTotalPausadoMinutos,
} from '@/features/pausas/lib/pausas-data';
import { useSessaoAtivaPausas } from '@/features/pausas/hooks/use-sessao-ativa-pausas';
import type { MonitorStats, OperadorEmPausa } from '@/features/pausas/types/pausas.schema';
import type { SessaoFuncionarioPausaApi } from '@/features/pausas/types/pausas.api';
import { finalizarSessaoFuncionarioPausa } from '@/features/sessao-operacao/lib/sessao-operacao-api';

const POLL_INTERVAL_MS = 30_000;

const EMPTY_STATS: MonitorStats = {
  emPausa: 0,
  totalOperadores: 0,
  atrasosCriticos: 0,
  totalPausadoMinutos: 0,
  pausaMaisLonga: '0 min',
  pausaMaisLongaOperador: '—',
};

function formatClock(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function usePausasMonitor() {
  const {
    sessaoAtiva,
    sessoesAbertas,
    funcionarios,
    isLoading: isLoadingSessao,
    semUnidade,
    semSessaoAberta,
    reload: reloadSessao,
    selectSessao,
  } = useSessaoAtivaPausas();

  const [isLoadingPausas, setIsLoadingPausas] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busca, setBusca] = useState('');
  const [operadores, setOperadores] = useState<OperadorEmPausa[]>([]);
  const [stats, setStats] = useState<MonitorStats>(EMPTY_STATS);
  const [clock, setClock] = useState('');

  const loadPausas = useCallback(async () => {
    if (!sessaoAtiva) {
      setOperadores([]);
      setStats(EMPTY_STATS);
      return;
    }

    setIsLoadingPausas(true);

    try {
      const dados = await fetchPausasPorFuncionarios(
        sessaoAtiva.id,
        funcionarios,
      );
      const now = new Date();
      const emPausa: OperadorEmPausa[] = [];
      const todasPausas: SessaoFuncionarioPausaApi[] = [];

      for (const { funcionario, pausas } of dados) {
        todasPausas.push(...pausas.items);
        if (pausas.emPausaAgora) {
          emPausa.push(
            mapToOperadorEmPausa(funcionario, pausas.emPausaAgora, now),
          );
        }
      }

      const totalPausado = sumTotalPausadoMinutos(dados);
      setOperadores(emPausa);
      setStats(
        computeMonitorStats(
          emPausa,
          funcionarios.length,
          totalPausado,
          todasPausas,
        ),
      );
    } catch {
      toast.error('Não foi possível carregar as pausas.');
    } finally {
      setIsLoadingPausas(false);
    }
  }, [sessaoAtiva, funcionarios]);

  useEffect(() => {
    void loadPausas();
  }, [loadPausas]);

  useEffect(() => {
    if (!sessaoAtiva) return;

    const id = setInterval(() => {
      void loadPausas();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [sessaoAtiva, loadPausas]);

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const operadoresFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();
    if (!term) return operadores;
    return operadores.filter(
      (op) =>
        op.nome.toLowerCase().includes(term) ||
        op.matricula.toLowerCase().includes(term),
    );
  }, [operadores, busca]);

  const encerrarPausa = useCallback(
    async (funcionarioId: number) => {
      if (!sessaoAtiva) {
        return { success: false as const };
      }

      setIsSubmitting(true);

      try {
        await finalizarSessaoFuncionarioPausa(
          sessaoAtiva.id,
          funcionarioId,
        );
        await loadPausas();
        const op = operadores.find((o) => o.funcionarioId === funcionarioId);
        return { success: true as const, nome: op?.nome ?? 'Operador' };
      } catch (error) {
        if (error instanceof ApiClientError) {
          if (error.status === 403) {
            toast.error('Sem permissão para gerenciar pausas.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error('Não foi possível encerrar a pausa.');
        }
        return { success: false as const };
      } finally {
        setIsSubmitting(false);
      }
    },
    [sessaoAtiva, loadPausas, operadores],
  );

  const reload = useCallback(async () => {
    await reloadSessao();
    await loadPausas();
  }, [reloadSessao, loadPausas]);

  return {
    isLoading: isLoadingSessao || isLoadingPausas,
    isSubmitting,
    stats,
    operadores: operadoresFiltrados,
    busca,
    setBusca,
    clock,
    sessaoAtiva,
    sessoesAbertas,
    selectSessao,
    semUnidade,
    semSessaoAberta,
    encerrarPausa,
    reload,
  };
}
