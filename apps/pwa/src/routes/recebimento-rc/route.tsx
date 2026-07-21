import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router';

import { ProductCatalogSyncRc } from '@/features/recebimento-rc/components/product-catalog-sync-rc';
import { RcChecklistPhotoSyncWatcher } from '@/features/recebimento-rc/components/rc-checklist-photo-sync-watcher';
import { RcSyncDebugPanel } from '@/features/recebimento-rc/components/rc-sync-debug-panel';
import { ReplicacheProvider } from '@/lib/replicache/replicache-provider';

export const Route = createFileRoute('/recebimento-rc')({
  component: RecebimentoRcLayout,
});

function RecebimentoRcLayout() {
  const isSyncPage = useRouterState({
    select: (state) => state.location.pathname.endsWith('/recebimento-rc/sync'),
  });

  return (
    <ReplicacheProvider>
      <RcChecklistPhotoSyncWatcher />
      <ProductCatalogSyncRc>
        <div className="flex min-h-0 flex-1 flex-col">
          {!isSyncPage ? <RcSyncDebugPanel className="shrink-0" /> : null}
          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </div>
      </ProductCatalogSyncRc>
    </ReplicacheProvider>
  );
}
