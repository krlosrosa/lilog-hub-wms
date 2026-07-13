import { fetchPackage } from '../api/sync-api.js';
import { recebimentoV2Db } from '../local-db/db.js';
import type { ExpectedItemRecord, ProductRecord } from '../local-db/schema.js';
import { resolveUnidadesPorCaixa } from '../lib/resolve-produto-conferencia-v2.js';

type ProdutoMeta = {
  sku: string;
  descricao: string;
  unidadesPorCaixa?: number;
};

type PackageWithDetalhe = {
  detalhe?: {
    produtos?: Array<{
      produtoId: string;
      sku: string;
      descricao: string;
      unidadesPorCaixa?: number;
    }>;
  };
  preRecebimento?: {
    itens?: Array<{
      produtoId: string;
      sku?: string;
      descricao?: string;
      unidadesPorCaixa?: number;
    }>;
  };
};

function resolveItemMeta(
  item: ExpectedItemRecord,
  catalog?: ProductRecord,
  detalhe?: ProdutoMeta,
): { sku: string; descricao: string; unidadesPorCaixa?: number } | null {
  const sku =
    (item.sku !== item.produtoId ? item.sku : undefined) ||
    detalhe?.sku ||
    catalog?.sku ||
    item.produtoId;
  const descricao =
    item.descricao?.trim() ||
    detalhe?.descricao?.trim() ||
    catalog?.description?.trim() ||
    '';
  const unidadesPorCaixa = resolveUnidadesPorCaixa(
    item.unidadesPorCaixa,
    detalhe?.unidadesPorCaixa,
    catalog?.unidadesPorCaixa,
  );

  const skuChanged = sku !== item.sku;
  const descricaoChanged = descricao !== item.descricao;
  const upcChanged =
    item.unidadesPorCaixa == null ||
    item.unidadesPorCaixa <= 0 ||
    item.unidadesPorCaixa !== unidadesPorCaixa;

  if (!skuChanged && !descricaoChanged && !upcChanged) {
    return null;
  }

  return { sku, descricao, unidadesPorCaixa };
}

function itemNeedsRepair(item: ExpectedItemRecord): boolean {
  return (
    !item.descricao?.trim() ||
    item.sku === item.produtoId ||
    item.unidadesPorCaixa == null ||
    item.unidadesPorCaixa <= 0
  );
}

/**
 * Repara sku/descrição/unidadesPorCaixa de itens esperados usando catálogo local
 * e, se necessário, o pacote da demanda.
 */
export async function enrichDemandItemMetadata(demandId: string): Promise<void> {
  const items = await recebimentoV2Db.expectedItems
    .where('demandId')
    .equals(demandId)
    .toArray();

  if (items.length === 0 || !items.some(itemNeedsRepair)) {
    return;
  }

  const produtoIds = items.map((item) => item.produtoId);
  const catalogProducts = await recebimentoV2Db.products.bulkGet(produtoIds);
  const catalogByProdutoId = new Map(
    catalogProducts
      .filter((product): product is ProductRecord =>
        Boolean(product && product.deletedAt === null),
      )
      .map((product) => [product.produtoId, product]),
  );

  let packageProdutos = new Map<string, ProdutoMeta>();
  const needsPackage = items.some(itemNeedsRepair);

  if (needsPackage && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const pkg = (await fetchPackage(demandId)) as PackageWithDetalhe;

      for (const produto of pkg.detalhe?.produtos ?? []) {
        packageProdutos.set(produto.produtoId, {
          sku: produto.sku,
          descricao: produto.descricao,
          unidadesPorCaixa: produto.unidadesPorCaixa,
        });
      }

      for (const item of pkg.preRecebimento?.itens ?? []) {
        const current = packageProdutos.get(item.produtoId);
        packageProdutos.set(item.produtoId, {
          sku: item.sku ?? current?.sku ?? item.produtoId,
          descricao: item.descricao ?? current?.descricao ?? '',
          unidadesPorCaixa: item.unidadesPorCaixa ?? current?.unidadesPorCaixa,
        });
      }
    } catch {
      // Mantém reparo apenas com catálogo local quando offline ou API indisponível.
    }
  }

  await recebimentoV2Db.transaction(
    'rw',
    [recebimentoV2Db.expectedItems, recebimentoV2Db.products],
    async () => {
      for (const item of items) {
        const catalog = catalogByProdutoId.get(item.produtoId);
        const fromPackage = packageProdutos.get(item.produtoId);
        const resolved = resolveItemMeta(item, catalog, fromPackage);

        if (resolved) {
          await recebimentoV2Db.expectedItems.update(item.id, {
            sku: resolved.sku,
            descricao: resolved.descricao,
            unidadesPorCaixa: resolved.unidadesPorCaixa,
            updatedAt: Date.now(),
          });
        }

        if (catalog && fromPackage?.unidadesPorCaixa && catalog.unidadesPorCaixa <= 0) {
          await recebimentoV2Db.products.update(item.produtoId, {
            unidadesPorCaixa: fromPackage.unidadesPorCaixa,
            updatedAt: Date.now(),
          });
        }

        if (fromPackage && catalog && !catalog.description?.trim() && fromPackage.descricao.trim()) {
          await recebimentoV2Db.products.update(item.produtoId, {
            sku: fromPackage.sku,
            description: fromPackage.descricao,
            updatedAt: Date.now(),
          });
        }
      }
    },
  );
}
