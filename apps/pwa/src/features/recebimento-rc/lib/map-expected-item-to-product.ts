import type { ExpectedItemView } from '@lilog/contracts';

import type { ProductRecord } from '@/features/recebimento-v2/local-db/schema';

export function mapExpectedItemToProduct(
  item: ExpectedItemView,
  unidadeId: string,
): ProductRecord {
  return {
    produtoId: item.produtoId,
    sku: item.sku,
    description: item.descricao,
    unidadeId,
    empresa: '',
    categoria: item.config.controlaLote ? 'refrigerado' : '',
    tipo: item.config.pesoVariavel ? 'PVAR' : '',
    ean: '',
    dum: '',
    shelfLife: item.config.controlaValidade ? 1 : 0,
    pesoBrutoUnidade: 0,
    pesoBrutoCaixa: 0,
    pesoBrutoPalete: 0,
    pesoLiquidoUnidade: 0,
    pesoLiquidoCaixa: 0,
    pesoLiquidoPalete: 0,
    unidadesPorCaixa: item.unidadesPorCaixa,
    caixasPorPalete: 1,
    controlaLote: item.config.controlaLote,
    controlaValidade: item.config.controlaValidade,
    controlaPeso: item.config.controlaPeso,
    pesoVariavel: item.config.pesoVariavel,
    serverRevision: 0,
    updatedAt: Date.now(),
    deletedAt: null,
  };
}

export function findExpectedItemBySku(
  items: ExpectedItemView[],
  sku: string,
): ExpectedItemView | undefined {
  const normalized = sku.trim().replace(/^["']+|["']+$/g, '').toUpperCase();
  return items.find(
    (item) => item.sku.trim().replace(/^["']+|["']+$/g, '').toUpperCase() === normalized,
  );
}
