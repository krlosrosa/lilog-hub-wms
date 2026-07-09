import type { ConferenciaItemMeta } from './map-conferencia-itens';
import type { MappedConferenciaContext } from './map-conferencia-itens';
import {
  applyResumoToSkuItems,
  removeResumoConferidoLocal,
  resolveQtdContabilForProduto,
  resolveQtdFisicaFromLotes,
  upsertResumoConferidoLocal,
} from './resolve-recebimento-divergencia';
import type { LoteConferido } from '../types/recebimento.schema';

export function mergeSkuConferenciaIntoContext(
  context: MappedConferenciaContext,
  input: {
    sku: string;
    meta: ConferenciaItemMeta;
    lotes: LoteConferido[];
    removing: boolean;
  },
): MappedConferenciaContext {
  const normalizedSku = input.sku.trim().toLowerCase();
  const itemMetaBySku = {
    ...context.itemMetaBySku,
    [normalizedSku]: input.meta,
  };

  let nextItems = [...context.itens];
  const existingIndex = nextItems.findIndex(
    (item) => item.sku.toLowerCase() === normalizedSku,
  );

  if (input.removing) {
    if (existingIndex >= 0) {
      nextItems[existingIndex] = {
        ...nextItems[existingIndex]!,
        status: 'pendente',
        hasDivergencia: false,
        qtdEsperada: undefined,
        qtdConferida: undefined,
        quantidadeEsperada: undefined,
      };
    }
  } else if (existingIndex >= 0) {
    nextItems[existingIndex] = {
      ...nextItems[existingIndex]!,
      status: 'conferido',
    };
  } else {
    nextItems.push({
      sku: input.meta.sku,
      name: input.meta.descricao,
      status: 'conferido',
    });
  }

  const resumoConferido = input.removing
    ? removeResumoConferidoLocal({
        resumoConferido: context.resumoConferido ?? [],
        produtoId: input.meta.produtoId,
      })
    : upsertResumoConferidoLocal({
        resumoConferido: context.resumoConferido ?? [],
        produtoId: input.meta.produtoId,
        qtdFisica: resolveQtdFisicaFromLotes(
          input.lotes,
          input.meta.unidadesPorCaixa,
        ),
        qtdContabil: resolveQtdContabilForProduto(
          context,
          input.meta.produtoId,
          input.sku,
        ),
      });

  nextItems = applyResumoToSkuItems(nextItems, itemMetaBySku, resumoConferido);

  const conferidoSkus = new Set(context.conferidoSkus);
  if (input.removing) {
    conferidoSkus.delete(normalizedSku);
  } else {
    conferidoSkus.add(normalizedSku);
  }

  const conferidosDetalheByProdutoId = {
    ...context.conferidosDetalheByProdutoId,
  };
  if (input.removing) {
    delete conferidosDetalheByProdutoId[input.meta.produtoId];
  }

  return {
    ...context,
    itens: nextItems,
    itemMetaBySku,
    resumoConferido,
    conferidoSkus,
    conferidosDetalheByProdutoId,
  };
}
