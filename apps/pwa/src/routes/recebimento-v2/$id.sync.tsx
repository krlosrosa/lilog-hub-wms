import { createFileRoute } from '@tanstack/react-router';

import { SyncManagerV2View } from '@/features/recebimento-v2/views/sync-manager-v2-view';

export const Route = createFileRoute('/recebimento-v2/$id/sync')({
  component: function SyncManagerPage() {
    const { id } = Route.useParams();
    return <SyncManagerV2View demandId={id} />;
  },
});
