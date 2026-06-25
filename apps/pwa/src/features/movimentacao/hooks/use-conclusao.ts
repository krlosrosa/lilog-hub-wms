import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { getProximaTarefa } from '../utils/tarefa-queue';
import { useTarefaById } from './use-tarefa-by-id';

const ELAPSED_TIME = '00:04:32';
const TARGET_TIME = '00:05:00';
const PERFORMANCE_DELTA = '-9.3%';
const AUTO_REDIRECT_MS = 3000;

export function useConclusao(tarefaId: string) {
  const navigate = useNavigate();
  const tarefa = useTarefaById(tarefaId);
  const proximaTarefa = getProximaTarefa(tarefaId, []);

  const irParaProximaDemanda = useCallback(() => {
    if (proximaTarefa) {
      void navigate({
        to: '/movimentacao/$id/confirmacao-coleta',
        params: { id: proximaTarefa.id },
      });
      return;
    }
    void navigate({ to: '/movimentacao' });
  }, [navigate, proximaTarefa]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      hapticMedium();
      irParaProximaDemanda();
    }, AUTO_REDIRECT_MS);

    return () => window.clearTimeout(timer);
  }, [irParaProximaDemanda]);

  const onProximaTarefa = useCallback(() => {
    hapticMedium();
    irParaProximaDemanda();
  }, [irParaProximaDemanda]);

  const onVoltar = useCallback(() => {
    hapticMedium();
    void navigate({ to: '/movimentacao' });
  }, [navigate]);

  return {
    state: {
      tarefa,
      taskId: tarefa?.taskId ?? '#TK-8842-A',
      destino: tarefa?.destino ?? 'ZONE-B-L04',
      elapsedTime: ELAPSED_TIME,
      targetTime: TARGET_TIME,
      performanceDelta: PERFORMANCE_DELTA,
      loteMessage: 'Estoque verificado na posição 042-8.',
      proximaTarefa,
      autoRedirectSeconds: AUTO_REDIRECT_MS / 1000,
    },
    actions: {
      onProximaTarefa,
      onVoltar,
    },
  };
}
