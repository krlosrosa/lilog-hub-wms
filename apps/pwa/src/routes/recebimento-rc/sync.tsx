import { createFileRoute } from '@tanstack/react-router';

import { SyncRcView } from '@/features/recebimento-rc/views/sync-rc-view';

export const Route = createFileRoute('/recebimento-rc/sync')({
  component: RecebimentoRcSyncPage,
});

function RecebimentoRcSyncPage() {
  return <SyncRcView />;
}
