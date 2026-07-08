import type { TarefaArmazenagemApi } from './armazenagem-api';
import type { ArmazenagemItem } from '../types/armazenagem.schema';
import { mapItemArmazenagemToView } from './map-item-armazenagem';

export type ArmazenagemScanMode = 'produto' | 'etiqueta';

function mapTarefaStatus(
  status: TarefaArmazenagemApi['status'],
): ArmazenagemItem['status'] {
  if (status === 'armazenada') return 'guardado';
  if (status === 'divergente') return 'parcial';
  if (status === 'em_andamento') return 'em_andamento';
  return 'pendente';
}

function resolveCodigoProduto(
  tarefa: TarefaArmazenagemApi,
  mappedItem: ArmazenagemItem | null,
  scanMode: ArmazenagemScanMode,
): string {
  if (scanMode === 'etiqueta') {
    return (
      tarefa.unitizadorCodigo ??
      mappedItem?.codigoProduto ??
      `PAL-${tarefa.sequencia}`
    );
  }

  return mappedItem?.codigoProduto ?? `PAL-${tarefa.sequencia}`;
}

export function mapTarefaArmazenagemToView(
  tarefa: TarefaArmazenagemApi,
  scanMode: ArmazenagemScanMode = 'etiqueta',
): ArmazenagemItem {
  const itemPrincipal = tarefa.itens[0];
  const mappedItem = itemPrincipal
    ? mapItemArmazenagemToView(itemPrincipal, tarefa.sequencia)
    : null;

  return {
    id: tarefa.id,
    codigoProduto: resolveCodigoProduto(tarefa, mappedItem, scanMode),
    nomeProduto: mappedItem?.nomeProduto ?? `Palete ${tarefa.sequencia}`,
    enderecoPickingDesignado:
      tarefa.enderecoSugeridoLabel ?? tarefa.enderecoSugeridoId ?? '',
    enderecoSugeridoId: tarefa.enderecoSugeridoId,
    status: mapTarefaStatus(tarefa.status),
    sequence: tarefa.sequencia,
    quantidadeSolicitadaCaixas: mappedItem?.quantidadeSolicitadaCaixas ?? 0,
    quantidadeSolicitadaUnidades: mappedItem?.quantidadeSolicitadaUnidades ?? 0,
  };
}

export function mapDemandaToArmazenagemItens(
  tarefas: TarefaArmazenagemApi[] | undefined,
  itens: Parameters<typeof mapItemArmazenagemToView>[0][],
  scanMode: ArmazenagemScanMode = 'etiqueta',
): ArmazenagemItem[] {
  if (tarefas && tarefas.length > 0) {
    return tarefas.map((tarefa) => mapTarefaArmazenagemToView(tarefa, scanMode));
  }

  return itens.map((item, index) =>
    mapItemArmazenagemToView(item, index + 1, scanMode),
  );
}
