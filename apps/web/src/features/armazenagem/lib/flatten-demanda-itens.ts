import type {
  DemandaArmazenagemDetailApi,
  ItemArmazenagemApi,
} from '../types/armazenagem.api';

export function flattenDemandaItens(
  demanda: DemandaArmazenagemDetailApi,
): ItemArmazenagemApi[] {
  const codigoPorItemId = new Map<string, string | null>();
  const codigoPorTarefaId = new Map<string, string | null>();

  for (const tarefa of demanda.tarefas ?? []) {
    if (tarefa.unitizadorCodigo) {
      codigoPorTarefaId.set(tarefa.id, tarefa.unitizadorCodigo);
    }

    for (const item of tarefa.itens) {
      codigoPorItemId.set(
        item.id,
        item.unitizadorCodigo ?? tarefa.unitizadorCodigo ?? null,
      );
    }
  }

  return demanda.itens.map((item) => ({
    ...item,
    unitizadorCodigo:
      item.unitizadorCodigo ??
      codigoPorItemId.get(item.id) ??
      (item.tarefaId ? (codigoPorTarefaId.get(item.tarefaId) ?? null) : null) ??
      null,
  }));
}
