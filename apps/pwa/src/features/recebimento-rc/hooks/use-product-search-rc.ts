import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';

import type { ProductRecord } from '@/features/recebimento-v2/local-db/schema';
import {
  getProductCatalogCount,
  searchProductsInCatalog,
} from '@/features/recebimento-v2/services/product-catalog.service';
import { useExpectedItemsReplicache } from '@/lib/replicache/hooks';

import { mapExpectedItemToProduct } from '../lib/map-expected-item-to-product';
import { useProductCatalogSyncRc } from './use-product-catalog-sync-rc';

export function useProductSearchRc(
  preRecebimentoId: string,
  unidadeId: string | undefined,
  query: string,
) {
  const expectedItems = useExpectedItemsReplicache(preRecebimentoId);
  const { catalogReady: catalogReadyFromSync } = useProductCatalogSyncRc();

  const catalogCount = useLiveQuery(
    () => (unidadeId ? getProductCatalogCount(unidadeId) : Promise.resolve(0)),
    [unidadeId],
  );

  const catalogReady = catalogReadyFromSync || (catalogCount ?? 0) > 0;

  const expectedResults = useMemo(() => {
    if (!unidadeId || !query.trim()) {
      return [] as ProductRecord[];
    }

    const normalized = query.trim().toLowerCase();
    return expectedItems
      .filter(
        (item) =>
          item.sku.toLowerCase().includes(normalized) ||
          item.descricao.toLowerCase().includes(normalized),
      )
      .slice(0, 20)
      .map((item) => mapExpectedItemToProduct(item, unidadeId));
  }, [expectedItems, query, unidadeId]);

  const [catalogResults, setCatalogResults] = useState<ProductRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!unidadeId || !query.trim()) {
      setCatalogResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsSearching(true);
      searchProductsInCatalog(unidadeId, query)
        .then(setCatalogResults)
        .catch(() => setCatalogResults([]))
        .finally(() => setIsSearching(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, unidadeId]);

  const results = useMemo(() => {
    const seenProdutoIds = new Set<string>();
    const merged: ProductRecord[] = [];

    for (const product of expectedResults) {
      if (seenProdutoIds.has(product.produtoId)) {
        continue;
      }
      seenProdutoIds.add(product.produtoId);
      merged.push(product);
    }

    for (const product of catalogResults) {
      if (seenProdutoIds.has(product.produtoId)) {
        continue;
      }
      seenProdutoIds.add(product.produtoId);
      merged.push(product);
    }

    return merged.slice(0, 20);
  }, [catalogResults, expectedResults]);

  return {
    results,
    isSearching,
    isReady: catalogReady,
  };
}
