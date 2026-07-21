import type { ReactNode } from 'react';

import {
  ProductCatalogSyncContext,
  useProductCatalogSyncState,
  useProductCatalogSyncRc,
} from '../hooks/use-product-catalog-sync-rc';

export { useProductCatalogSyncRc };

export function ProductCatalogSyncRc({ children }: { children: ReactNode }) {
  const value = useProductCatalogSyncState();

  return (
    <ProductCatalogSyncContext.Provider value={value}>
      {children}
    </ProductCatalogSyncContext.Provider>
  );
}
