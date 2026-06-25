import type { Tarefa } from '../types/movimentacao.schema';

const PRIORITY_ORDER = { alta: 0, media: 1, baixa: 2 } as const;

export function getTarefasOrdenadas(tarefas: Tarefa[]): Tarefa[] {
  return [...tarefas].sort(
    (a, b) => PRIORITY_ORDER[a.prioridade] - PRIORITY_ORDER[b.prioridade],
  );
}

export function getProximaTarefa(
  currentId: string,
  tarefas: Tarefa[],
): Tarefa | undefined {
  const list = getTarefasOrdenadas(tarefas);
  const index = list.findIndex((t) => t.id === currentId);
  if (index === -1) return list[0];
  return list[index + 1];
}
