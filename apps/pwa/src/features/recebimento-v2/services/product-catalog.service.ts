import { fetchProducts } from '../api/sync-api.js';
import { recebimentoV2Db } from '../local-db/db.js';
import type { ProductRecord } from '../local-db/schema.js';

type ProductDatasetRow = {
  produtoId: string;
  sku: string;
  descricao?: string;
  description?: string;
  unidadeId?: string;
  empresa?: string;
  categoria?: string;
  tipo?: string;
  ean?: string;
  dum?: string;
  shelfLife?: number;
  pesoBrutoUnidade?: number;
  pesoBrutoCaixa?: number;
  pesoBrutoPalete?: number;
  pesoLiquidoUnidade?: number;
  pesoLiquidoCaixa?: number;
  pesoLiquidoPalete?: number;
  unidadesPorCaixa?: number;
  caixasPorPalete?: number;
  controlaLote?: boolean;
  controlaValidade?: boolean;
  controlaPeso?: boolean;
  pesoVariavel?: boolean;
  serverRevision?: number;
  updatedAt?: number | string;
  deletedAt?: number | null;
  tombstone?: boolean;
};

function mapProductDatasetRow(item: ProductDatasetRow, unidadeId: string): ProductRecord {
  const updatedAt =
    typeof item.updatedAt === 'number'
      ? item.updatedAt
      : item.updatedAt
        ? Date.parse(item.updatedAt)
        : Date.now();

  const tipo = item.tipo ?? '';
  const categoria = item.categoria ?? '';
  const shelfLife = item.shelfLife ?? 0;
  const pesoVariavel =
    item.pesoVariavel ?? tipo.trim().toUpperCase() === 'PVAR';

  return {
    produtoId: item.produtoId,
    sku: item.sku,
    description: item.descricao ?? item.description ?? '',
    unidadeId: item.unidadeId ?? unidadeId,
    empresa: item.empresa ?? '',
    categoria,
    tipo,
    ean: item.ean ?? '',
    dum: item.dum ?? '',
    shelfLife,
    pesoBrutoUnidade: item.pesoBrutoUnidade ?? 0,
    pesoBrutoCaixa: item.pesoBrutoCaixa ?? 0,
    pesoBrutoPalete: item.pesoBrutoPalete ?? 0,
    pesoLiquidoUnidade: item.pesoLiquidoUnidade ?? 0,
    pesoLiquidoCaixa: item.pesoLiquidoCaixa ?? 0,
    pesoLiquidoPalete: item.pesoLiquidoPalete ?? 0,
    unidadesPorCaixa: item.unidadesPorCaixa ?? 0,
    caixasPorPalete: item.caixasPorPalete ?? 0,
    controlaLote:
      item.controlaLote ??
      (categoria === 'refrigerado' || categoria === 'queijo'),
    controlaValidade: item.controlaValidade ?? shelfLife > 0,
    controlaPeso: item.controlaPeso ?? pesoVariavel,
    pesoVariavel,
    serverRevision: item.serverRevision ?? 0,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
    deletedAt: item.deletedAt ?? null,
  };
}

export async function getProductCatalogCount(unidadeId: string): Promise<number> {
  if (!unidadeId.trim()) {
    return 0;
  }

  return recebimentoV2Db.products
    .where('unidadeId')
    .equals(unidadeId)
    .filter((product) => product.deletedAt === null)
    .count();
}

export async function updateProductCatalog(unidadeId: string): Promise<void> {
  const cursorRecord = await recebimentoV2Db.syncCursors.get(`products:${unidadeId}`);
  let nextCursor: string | undefined = cursorRecord?.cursor;
  let hasMore = true;

  while (hasMore) {
    const dataset = await fetchProducts(unidadeId, nextCursor);

    await recebimentoV2Db.transaction('rw', recebimentoV2Db.products, async () => {
      for (const item of dataset.items) {
        const product = item as ProductDatasetRow;
        if (product.tombstone) {
          await recebimentoV2Db.products.delete(product.produtoId);
        } else {
          await recebimentoV2Db.products.put(mapProductDatasetRow(product, unidadeId));
        }
      }
    });

    if (dataset.nextCursor) {
      await recebimentoV2Db.syncCursors.put({
        id: `products:${unidadeId}`,
        cursor: dataset.nextCursor,
        lastSyncedAt: Date.now(),
      });
      nextCursor = dataset.nextCursor;
    }

    hasMore = dataset.hasMore && !!dataset.nextCursor;
  }
}

export async function searchProductsInCatalog(
  unidadeId: string,
  query: string,
): Promise<ProductRecord[]> {
  if (!unidadeId.trim() || !query.trim()) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();

  const unitProducts = await recebimentoV2Db.products
    .where('unidadeId')
    .equals(unidadeId)
    .filter((product) => product.deletedAt === null)
    .toArray();

  const bySku = unitProducts.filter(
    (product) => product.sku.toLowerCase() === normalizedQuery,
  );
  if (bySku.length > 0) {
    return bySku.slice(0, 5);
  }

  const byEan = unitProducts.filter(
    (product) => product.ean?.toLowerCase() === normalizedQuery,
  );
  if (byEan.length > 0) {
    return byEan.slice(0, 5);
  }

  return unitProducts
    .filter((product) => product.description.toLowerCase().includes(normalizedQuery))
    .slice(0, 20);
}
