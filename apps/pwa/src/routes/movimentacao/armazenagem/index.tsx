import { createFileRoute } from '@tanstack/react-router';

import { ArmazenagemScanEntryView } from '@/features/estoque/armazenagem/views/armazenagem-scan-entry-view';

export const Route = createFileRoute('/movimentacao/armazenagem/')({
  component: ArmazenagemScanEntryRoute,
});

function ArmazenagemScanEntryRoute() {
  return <ArmazenagemScanEntryView />;
}
