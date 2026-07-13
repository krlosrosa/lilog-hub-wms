import type {
  ParametrosRecebimentoConferencia,
  ProdutoConferenciaConfigForm,
  QuantidadeModo,
} from '@/features/recebimento/types/recebimento.schema';

import { recebimentoV2Db } from '../local-db/db';
import type { ExpectedItemRecord, ProductRecord } from '../local-db/schema';

export function normalizeSkuParam(sku: string | undefined): string {
  if (!sku) return '';
  return sku.trim().replace(/^["']+|["']+$/g, '');
}

export function resolveUnidadesPorCaixa(
  ...sources: Array<number | null | undefined>
): number {
  for (const value of sources) {
    if (value != null && value > 0) {
      return value;
    }
  }
  return 1;
}

export function isProdutoTipoPvar(tipo: string | null | undefined): boolean {
  return (tipo ?? '').trim().toUpperCase() === 'PVAR';
}

export function resolveProductCatalogFlags(
  product: Pick<
    ProductRecord,
    'tipo' | 'pesoVariavel' | 'categoria' | 'shelfLife' | 'controlaLote' | 'controlaValidade' | 'controlaPeso'
  >,
): Pick<ProductRecord, 'pesoVariavel' | 'controlaLote' | 'controlaValidade' | 'controlaPeso'> {
  const pesoVariavel = product.pesoVariavel || isProdutoTipoPvar(product.tipo);

  return {
    pesoVariavel,
    controlaLote:
      product.controlaLote ||
      product.categoria === 'refrigerado' ||
      product.categoria === 'queijo',
    controlaValidade: product.controlaValidade || product.shelfLife > 0,
    controlaPeso: product.controlaPeso || pesoVariavel,
  };
}

export function resolveProdutoConferenciaV2(
  product: ProductRecord,
  parametros: ParametrosRecebimentoConferencia,
): ProdutoConferenciaConfigForm {
  const flags = resolveProductCatalogFlags(product);
  const isPvar = flags.pesoVariavel && parametros.solicitarPesoPvar;

  return {
    controlaLote: flags.controlaLote,
    controlaValidade: flags.controlaValidade,
    controlaPeso: isPvar || flags.controlaPeso,
    pesoVariavel: isPvar,
    exigirEtiquetaPesoVariavel: isPvar && parametros.exigirEtiquetaPesoVariavel,
    controlaNumeroSerie: false,
  };
}

function matchesSku(a: string, b: string): boolean {
  return normalizeSkuParam(a).toUpperCase() === normalizeSkuParam(b).toUpperCase();
}

export function isExactProductCodeMatch(
  inputCode: string,
  productSku: string,
  productEan?: string | null,
): boolean {
  const normalized = normalizeSkuParam(inputCode).toUpperCase();
  if (!normalized) return false;
  if (matchesSku(productSku, normalized)) return true;

  const ean = productEan?.trim();
  return Boolean(ean && matchesSku(ean, normalized));
}

function mergeProductRecord(
  catalog: ProductRecord,
  expectedItem?: ExpectedItemRecord | null,
): ProductRecord {
  return {
    ...catalog,
    sku: expectedItem?.sku?.trim() || catalog.sku,
    description: expectedItem?.descricao?.trim() || catalog.description,
    unidadesPorCaixa: resolveUnidadesPorCaixa(
      expectedItem?.unidadesPorCaixa,
      catalog.unidadesPorCaixa,
    ),
  };
}

function buildProductFromExpectedItem(
  item: ExpectedItemRecord,
  catalog?: ProductRecord | null,
): ProductRecord {
  const upc = resolveUnidadesPorCaixa(item.unidadesPorCaixa, catalog?.unidadesPorCaixa);
  const tipo = catalog?.tipo ?? '';
  const categoria = catalog?.categoria ?? '';
  const shelfLife = catalog?.shelfLife ?? 0;
  const flags = resolveProductCatalogFlags({
    tipo,
    pesoVariavel: catalog?.pesoVariavel ?? false,
    categoria,
    shelfLife,
    controlaLote: catalog?.controlaLote ?? false,
    controlaValidade: catalog?.controlaValidade ?? false,
    controlaPeso: catalog?.controlaPeso ?? false,
  });

  return {
    produtoId: item.produtoId,
    sku: item.sku,
    description: item.descricao?.trim() || catalog?.description || '',
    unidadeId: catalog?.unidadeId ?? '',
    empresa: catalog?.empresa ?? '',
    categoria,
    tipo,
    ean: catalog?.ean ?? '',
    dum: catalog?.dum ?? '',
    shelfLife,
    pesoBrutoUnidade: catalog?.pesoBrutoUnidade ?? 0,
    pesoBrutoCaixa: catalog?.pesoBrutoCaixa ?? 0,
    pesoBrutoPalete: catalog?.pesoBrutoPalete ?? 0,
    pesoLiquidoUnidade: catalog?.pesoLiquidoUnidade ?? 0,
    pesoLiquidoCaixa: catalog?.pesoLiquidoCaixa ?? 0,
    pesoLiquidoPalete: catalog?.pesoLiquidoPalete ?? 0,
    unidadesPorCaixa: upc,
    caixasPorPalete: catalog?.caixasPorPalete ?? 0,
    controlaLote: flags.controlaLote,
    controlaValidade: flags.controlaValidade,
    controlaPeso: flags.controlaPeso,
    pesoVariavel: flags.pesoVariavel,
    serverRevision: catalog?.serverRevision ?? 0,
    updatedAt: catalog?.updatedAt ?? Date.now(),
    deletedAt: null,
  };
}

export const CATALOGO_PRODUTO_NAO_ENCONTRADO_MSG = 'Produto não encontrado no catálogo';

export function isResolvableCatalogProduct(
  product: ProductRecord | null | undefined,
): product is ProductRecord {
  return Boolean(product?.produtoId && !product.produtoId.startsWith('novo-'));
}

export function createStubProductRecord(sku: string): ProductRecord {
  const normalizedSku = normalizeSkuParam(sku);
  return {
    produtoId: `novo-${normalizedSku}`,
    sku: normalizedSku,
    description: `Item novo (${normalizedSku})`,
    unidadeId: '',
    empresa: '',
    categoria: '',
    tipo: '',
    ean: '',
    dum: '',
    shelfLife: 0,
    pesoBrutoUnidade: 0,
    pesoBrutoCaixa: 0,
    pesoBrutoPalete: 0,
    pesoLiquidoUnidade: 0,
    pesoLiquidoCaixa: 0,
    pesoLiquidoPalete: 0,
    unidadesPorCaixa: 1,
    caixasPorPalete: 0,
    controlaLote: true,
    controlaValidade: true,
    controlaPeso: false,
    pesoVariavel: false,
    serverRevision: 0,
    updatedAt: Date.now(),
    deletedAt: null,
  };
}

export async function resolveProductForSkuV2(
  demandId: string,
  sku: string,
): Promise<ProductRecord | null> {
  const normalizedSku = normalizeSkuParam(sku);
  if (!normalizedSku) return null;

  const expectedItems = await recebimentoV2Db.expectedItems
    .where('demandId')
    .equals(demandId)
    .toArray();

  const expectedItem = expectedItems.find((item) => matchesSku(item.sku, normalizedSku));

  if (expectedItem) {
    const catalogProduct = await recebimentoV2Db.products.get(expectedItem.produtoId);
    if (catalogProduct && catalogProduct.deletedAt === null) {
      return mergeProductRecord(catalogProduct, expectedItem);
    }
    return buildProductFromExpectedItem(expectedItem, catalogProduct);
  }

  const catalogProducts = await recebimentoV2Db.products
    .filter(
      (product) =>
        !product.deletedAt &&
        matchesSku(product.sku, normalizedSku),
    )
    .toArray();

  return catalogProducts[0] ?? null;
}

export async function resolveProdutoIdForSkuV2(
  demandId: string,
  sku: string,
  product?: ProductRecord | null,
): Promise<string> {
  if (product?.produtoId && !product.produtoId.startsWith('novo-')) {
    return product.produtoId;
  }

  const normalizedSku = normalizeSkuParam(sku);

  const expectedItems = await recebimentoV2Db.expectedItems
    .where('demandId')
    .equals(demandId)
    .toArray();

  const expectedItem = expectedItems.find((item) => matchesSku(item.sku, normalizedSku));

  if (expectedItem) {
    if (expectedItem.produtoId.startsWith('novo-')) {
      const catalogProduct = await recebimentoV2Db.products
        .filter(
          (item) => !item.deletedAt && matchesSku(item.sku, normalizedSku),
        )
        .first();

      if (catalogProduct) {
        return catalogProduct.produtoId;
      }
    }

    return expectedItem.produtoId;
  }

  const catalogProduct = await recebimentoV2Db.products
    .filter(
      (item) => !item.deletedAt && matchesSku(item.sku, normalizedSku),
    )
    .first();

  if (catalogProduct) {
    return catalogProduct.produtoId;
  }

  return normalizedSku;
}

export function calcConferenceQuantityInUnidades(input: {
  recebidaCaixa: number;
  recebidaUnidade: number;
  unidadesPorCaixa: number;
  pesoVariavel: boolean;
}): number {
  if (input.pesoVariavel) {
    return 1;
  }

  const upc = resolveUnidadesPorCaixa(input.unidadesPorCaixa);
  return input.recebidaCaixa * upc + input.recebidaUnidade;
}

/**
 * Registros antigos gravaram caixas diretamente em `quantity` (UPC=1 no save).
 * Quando quantity < UPC, interpretamos como contagem de caixas, não UN base.
 */
export function isLegacyCaixaQuantityInQuantityField(
  quantity: number,
  upc: number,
  quantidadeModo: QuantidadeModo,
): boolean {
  return (
    quantity > 0 &&
    quantity < upc &&
    Number.isInteger(quantity) &&
    (quantidadeModo === 'caixa' || quantidadeModo === 'ambos')
  );
}

export function calcConferenceBaseUnitsFromRecord(
  record: Pick<ConferenceRecordLike, 'quantity' | 'recebidaCaixa' | 'recebidaUnidade'>,
  unidadesPorCaixa: number,
  quantidadeModo: QuantidadeModo = 'ambos',
): number {
  const upc = resolveUnidadesPorCaixa(unidadesPorCaixa);
  const hasExplicit =
    (record.recebidaCaixa ?? 0) > 0 || (record.recebidaUnidade ?? 0) > 0;

  if (hasExplicit) {
    return (record.recebidaCaixa ?? 0) * upc + (record.recebidaUnidade ?? 0);
  }

  if (
    isLegacyCaixaQuantityInQuantityField(record.quantity, upc, quantidadeModo)
  ) {
    return record.quantity * upc;
  }

  return record.quantity;
}

type ConferenceRecordLike = {
  quantity: number;
  recebidaCaixa?: number;
  recebidaUnidade?: number;
};
