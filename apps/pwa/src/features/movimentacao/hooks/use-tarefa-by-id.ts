import { useEffect, useState } from 'react';

import { fetchDemandaArmazenagem } from '@/features/estoque/armazenagem/lib/armazenagem-api';

import { mapDemandaDetailToTarefa } from '../lib/map-tarefa-armazenagem';
import type { Tarefa } from '../types/movimentacao.schema';

export function useTarefaById(tarefaId: string): Tarefa | undefined {
  const [tarefa, setTarefa] = useState<Tarefa | undefined>();

  useEffect(() => {
    let cancelled = false;

    void fetchDemandaArmazenagem(tarefaId)
      .then((demanda) => {
        if (!cancelled) {
          setTarefa(mapDemandaDetailToTarefa(demanda));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTarefa(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tarefaId]);

  return tarefa;
}
