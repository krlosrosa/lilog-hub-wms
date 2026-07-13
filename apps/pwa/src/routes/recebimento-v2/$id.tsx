import { createFileRoute, Outlet } from '@tanstack/react-router';

import { useAutoSyncV2 } from '@/features/recebimento-v2/hooks/use-auto-sync-v2';
import { useDemandHydrationV2 } from '@/features/recebimento-v2/hooks/use-demand-hydration-v2';
import { useReferenceDataHydrationV2 } from '@/features/recebimento-v2/hooks/use-reference-data-hydration-v2';

export const Route = createFileRoute('/recebimento-v2/$id')({
  component: DemandLayout,
});

function DemandLayout() {
  const { id } = Route.useParams();
  useAutoSyncV2(id);
  useDemandHydrationV2(id);
  useReferenceDataHydrationV2(id);
  return <Outlet />;
}
