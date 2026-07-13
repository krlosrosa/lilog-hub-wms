import type {
  ConferenciaContextApi,
  ConferenciaConferidoDetalheApi,
} from '../types/recebimento.api';
import type { SkuItem } from '../types/recebimento.schema';
import {
  applyResumoToSkuItems,
  toBaseUnits,
  type ResumoConferidoProduto,
} from './resolve-recebimento-divergencia';

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
  conferenteId?: number | null;
  conferente?: string | null;
  conferenteMatricula?: string | null;
  modoUnitizacao: string;
  exigePaleteConferencia: boolean;
  itens: SkuItem[];
  itemMetaBySku: Record<string, ConferenciaItemMeta>;
  conferidoSkus: Set<string>;
  conferidosDetalheByProdutoId: Record<string, ConferenciaConferidoDetalheApi[]>;
  resumoConferido: ResumoConferidoProduto[];
};

type ConferenciaContextItem = ConferenciaContextApi['itens'][number];

function groupItensPorProduto(
  itens: ConferenciaContextItem[],
): ConferenciaContextItem[] {
  const seen = new Map<string, ConferenciaContextItem>();

  for (const item of itens) {
    if (!seen.has(item.produtoId)) {
      seen.set(item.produtoId, item);
    }
  }

  return [...seen.values()];
}

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
    modoUnitizacao: context.modoUnitizacao ?? '',
    exigePaleteConferencia: context.exigePaleteConferencia ?? false,
    conferidoSkus: new Set(context.conferidoSkus),
    conferidosDetalheByProdutoId: context.conferidosDetalheByProdutoId ?? {},
    resumoConferido: context.resumoConferido ?? [],
  };
}

export function mapConferenciaContext(
  context: ConferenciaContextApi,
): MappedConferenciaContext {
  const conferidoProdutoIds = new Set(
    context.conferidos.map((item) => item.produtoId),
  );

  const conferidosDetalheByProdutoId = context.conferidos.reduce<
    Record<string, ConferenciaConferidoDetalheApi[]>
  >((acc, item) => {
    const current = acc[item.produtoId] ?? [];
    current.push(item);
    acc[item.produtoId] = current;
    return acc;
  }, {});

  const itemMetaBySku: Record<string, ConferenciaItemMeta> = {};
  const groupedItens = groupItensPorProduto(context.itens);
  const baseItens: SkuItem[] = groupedItens.map((item) => {
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

  const resumoConferidoFromApi = context.resumoConferido ?? [];
  const resumoByProdutoId = new Map(
    resumoConferidoFromApi.map((entry) => [entry.produtoId, entry]),
  );

  for (const item of groupedItens) {
    if (resumoByProdutoId.has(item.produtoId)) {
      continue;
    }

    const qtdContabil = toBaseUnits(
      item.quantidadeEsperada,
      item.unidadeMedida,
      item.unidadesPorCaixa,
    );

    resumoByProdutoId.set(item.produtoId, {
      produtoId: item.produtoId,
      qtdContabil,
      qtdFisica: 0,
      hasDivergencia: false,
    });
  }

  const resumoConferido = [...resumoByProdutoId.values()];

  const knownProdutoIds = new Set(groupedItens.map((item) => item.produtoId));
  const conferidoSkus = new Set(
    groupedItens
      .filter((item) => conferidoProdutoIds.has(item.produtoId))
      .map((item) => item.sku.toLowerCase()),
  );

  const orphanItens: SkuItem[] = context.conferidos
    .filter((conferido) => !knownProdutoIds.has(conferido.produtoId))
    .reduce<ConferenciaConferidoDetalheApi[]>((acc, conferido) => {
      if (!acc.some((entry) => entry.produtoId === conferido.produtoId)) {
        acc.push(conferido);
      }
      return acc;
    }, [])
    .map((conferido) => {
      itemMetaBySku[conferido.sku.toLowerCase()] = {
        produtoId: conferido.produtoId,
        sku: conferido.sku,
        descricao: conferido.descricao,
        unidadeMedida: conferido.unidadeMedida,
        unidadesPorCaixa: conferido.unidadesPorCaixa,
        config: conferido.config,
      };
      conferidoSkus.add(conferido.sku.toLowerCase());

      return {
        sku: conferido.sku,
        name: conferido.descricao,
        status: 'conferido' as const,
      };
    });

  const itens = applyResumoToSkuItems(
    [...baseItens, ...orphanItens],
    itemMetaBySku,
    resumoConferido,
  );

  const exigePaleteConferencia = context.exigePaleteConferencia ?? false;

  return {
    recebimentoId: context.recebimentoId,
    unidadeId: context.unidadeId,
    dock: context.dock,
    conferenteId: context.conferenteId ?? null,
    conferente: context.conferente ?? null,
    conferenteMatricula: context.conferenteMatricula ?? null,
    modoUnitizacao: context.modoUnitizacao,
    exigePaleteConferencia,
    itens,
    itemMetaBySku,
    conferidoSkus,
    conferidosDetalheByProdutoId,
    resumoConferido,
  };
}
