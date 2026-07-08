import type { ItemArmazenagemApi } from './armazenagem-api';
import type { ArmazenagemItem } from '../types/armazenagem.schema';

function mapStatus(
  status: ItemArmazenagemApi['status'],
): ArmazenagemItem['status'] {
  if (status === 'armazenado') return 'guardado';
  if (status === 'divergente') return 'parcial';
  if (status === 'em_andamento') return 'em_andamento';
  return 'pendente';
}

function resolveQuantidade(item: ItemArmazenagemApi) {
  const unidade = item.unidadeMedida.toUpperCase();
  if (unidade === 'CX' || unidade === 'CAIXA') {
    return {
      caixas: item.quantidade,
      unidades: 0,
    };
  }
  return {
    caixas: 0,
    unidades: item.quantidade,
  };
}

export function mapItemArmazenagemToView(
  item: ItemArmazenagemApi,
  sequence: number,
  scanMode: 'produto' | 'etiqueta' = 'produto',
): ArmazenagemItem {
  const quantidade = resolveQuantidade(item);

  const codigoProduto =
    scanMode === 'etiqueta' && item.unitizadorCodigo
      ? item.unitizadorCodigo
      : item.produtoSku ?? item.produtoId;

  return {
    id: item.id,
    codigoProduto,
    nomeProduto: item.produtoNome ?? 'Produto',
    enderecoPickingDesignado:
      item.enderecoSugeridoLabel ?? item.enderecoSugeridoId ?? '',
    enderecoSugeridoId: item.enderecoSugeridoId,
    status: mapStatus(item.status),
    sequence,
    quantidadeSolicitadaCaixas: quantidade.caixas,
    quantidadeSolicitadaUnidades: quantidade.unidades,
  };
}
