import type { ConferenciaContextApi } from '../types/recebimento.api';
import type { SkuItem } from '../types/recebimento.schema';

export type ConferenciaItemMeta = {
  produtoId: string;
  sku: string;
  descricao: string;
  unidadeMedida: string;
  unidadesPorCaixa: number;
  config: ConferenciaContextApi['itens'][number]['config'];
};

export type MappedConferenciaContext = {
  recebimentoId: string | null;
  unidadeId: string;
  dock: string | null;
  itens: SkuItem[];
  itemMetaBySku: Record<string, ConferenciaItemMeta>;
  conferidoSkus: Set<string>;
};

export type SerializedConferenciaContext = Omit<
  MappedConferenciaContext,
  'conferidoSkus'
> & {
  conferidoSkus: string[];
};

export function serializeConferenciaContext(
  context: MappedConferenciaContext,
): SerializedConferenciaContext {
  return {
    ...context,
    conferidoSkus: [...context.conferidoSkus],
  };
}

export function deserializeConferenciaContext(
  context: SerializedConferenciaContext,
): MappedConferenciaContext {
  return {
    ...context,
    conferidoSkus: new Set(context.conferidoSkus),
  };
}

export function mapConferenciaContext(
  context: ConferenciaContextApi,
): MappedConferenciaContext {
  const conferidoProdutoIds = new Set(
    context.conferidos.map((item) => item.produtoId),
  );

  const itemMetaBySku: Record<string, ConferenciaItemMeta> = {};
  const itens: SkuItem[] = context.itens.map((item) => {
    const meta: ConferenciaItemMeta = {
      produtoId: item.produtoId,
      sku: item.sku,
      descricao: item.descricao,
      unidadeMedida: item.unidadeMedida,
      unidadesPorCaixa: item.unidadesPorCaixa,
      config: item.config,
    };
    itemMetaBySku[item.sku.toLowerCase()] = meta;

    return {
      sku: item.sku,
      name: item.descricao,
      status: conferidoProdutoIds.has(item.produtoId) ? 'conferido' : 'pendente',
    };
  });

  const conferidoSkus = new Set(
    context.itens
      .filter((item) => conferidoProdutoIds.has(item.produtoId))
      .map((item) => item.sku.toLowerCase()),
  );

  return {
    recebimentoId: context.recebimentoId,
    unidadeId: context.unidadeId,
    dock: context.dock,
    itens,
    itemMetaBySku,
    conferidoSkus,
  };
}
