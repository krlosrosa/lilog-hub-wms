import type { RemessaItemInput } from '../../../domain/repositories/expedicao/upload-lote.repository.js';

function buildItemKey(item: RemessaItemInput): string {
  return `${item.sku}::${item.lote ?? ''}::${item.unidadeMedida}::${item.dataFabricacao ?? ''}`;
}

export function consolidarItensRemessa(
  itens: RemessaItemInput[],
): RemessaItemInput[] {
  const porChave = new Map<string, RemessaItemInput>();

  for (const item of itens) {
    const chave = buildItemKey(item);
    const atual = porChave.get(chave);

    if (!atual) {
      porChave.set(chave, { ...item });
      continue;
    }

    porChave.set(chave, {
      ...atual,
      peso: (atual.peso ?? 0) + (item.peso ?? 0),
      quantidade: atual.quantidade + item.quantidade,
      quantidadeNormalizadaUnidades:
        atual.quantidadeNormalizadaUnidades + item.quantidadeNormalizadaUnidades,
    });
  }

  return [...porChave.values()];
}
