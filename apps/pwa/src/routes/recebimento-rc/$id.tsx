import { createFileRoute, Outlet, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';

import { registerPhotoQueueForDemand } from '@/features/recebimento-v2/services/photo-upload-queue.service';

export const Route = createFileRoute('/recebimento-rc/$id')({
  component: DemandRcLayout,
});

function DemandRcLayout() {
  const { id } = useParams({ from: '/recebimento-rc/$id' });

  useEffect(() => {
    return registerPhotoQueueForDemand(id);
  }, [id]);

  return <Outlet />;
}
