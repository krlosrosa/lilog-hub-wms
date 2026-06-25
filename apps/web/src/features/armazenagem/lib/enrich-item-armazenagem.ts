import { getEndereco } from '@/features/enderecos/lib/endereco-api';
import { getProduto } from '@/features/produto/lib/produto-api';

import type { ItemArmazenagemView } from '../types/armazenagem.api';

export async function enrichItemArmazenagem(
  item: ItemArmazenagemView,
): Promise<ItemArmazenagemView> {
  const [produto, enderecoSugerido, enderecoConfirmado] = await Promise.all([
    getProduto(item.produtoId).catch(() => null),
    item.enderecoSugeridoId
      ? getEndereco(item.enderecoSugeridoId).catch(() => null)
      : Promise.resolve(null),
    item.enderecoConfirmadoId
      ? getEndereco(item.enderecoConfirmadoId).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    ...item,
    produtoSku: produto?.sku,
    produtoNome: produto?.descricao,
    enderecoSugeridoLabel: enderecoSugerido?.enderecoMascarado,
    enderecoConfirmadoLabel: enderecoConfirmado?.enderecoMascarado,
  };
}
