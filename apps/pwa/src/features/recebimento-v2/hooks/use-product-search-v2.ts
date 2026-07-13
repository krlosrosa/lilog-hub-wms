import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth';

import { recebimentoV2Db } from '../local-db/db';
import type { ProductRecord } from '../local-db/schema';

export interface UseProductSearchV2Result {
  searchProducts: (query: string) => Promise<ProductRecord[]>;
  getProduct: (sku: string) => Promise<ProductRecord | undefined>;
  isReady: boolean;
}

export function useProductSearchV2(): UseProductSearchV2Result {
  const { user } = useAuth();
  const unidadeId = user?.unidadeId ?? '';

  const catalogCount = useLiveQuery(
    () =>
      unidadeId
        ? recebimentoV2Db.products.where('unidadeId').equals(unidadeId).count()
        : Promise.resolve(0),
    [unidadeId],
  );

  const isReady = (catalogCount ?? 0) > 0;

  const searchProducts = useCallback(
    async (query: string): Promise<ProductRecord[]> => {
      if (!query.trim() || !unidadeId) return [];

      const normalizedQuery = query.trim().toLowerCase();

      const unitProducts = await recebimentoV2Db.products
        .where('unidadeId')
        .equals(unidadeId)
        .filter((p) => !p.deletedAt)
        .toArray();

      const bySku = unitProducts.filter(
        (p) => p.sku.toLowerCase() === normalizedQuery,
      );
      if (bySku.length > 0) return bySku.slice(0, 5);

      const byEan = unitProducts.filter(
        (p) => p.ean?.toLowerCase() === normalizedQuery,
      );
      if (byEan.length > 0) return byEan.slice(0, 5);

      return unitProducts
        .filter((p) => p.description.toLowerCase().includes(normalizedQuery))
        .slice(0, 20);
    },
    [unidadeId],
  );

  const getProduct = useCallback(
    async (sku: string): Promise<ProductRecord | undefined> => {
      if (!unidadeId) return undefined;
      const normalizedSku = sku.trim().replace(/^["']+|["']+$/g, '').toLowerCase();
      return recebimentoV2Db.products
        .where('unidadeId')
        .equals(unidadeId)
        .filter(
          (p) => !p.deletedAt && p.sku.toLowerCase() === normalizedSku,
        )
        .first();
    },
    [unidadeId],
  );

  return { searchProducts, getProduct, isReady };
}

/**
 * Convenience hook that performs a live search with debouncing.
 */
export function useProductSearchQuery(query: string) {
  const { searchProducts, isReady } = useProductSearchV2();
  const [results, setResults] = useState<ProductRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      searchProducts(query)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, searchProducts]);

  return { results, isSearching, isReady };
}
