import { createFileRoute } from '@tanstack/react-router';

import { ConflitoV2View } from '@/features/recebimento-v2/views/conflito-v2-view';

export const Route = createFileRoute('/recebimento-v2/$id/conflito')({
  component: function ConflitoPage() {
    const { id } = Route.useParams();
    return <ConflitoV2View demandId={id} />;
  },
});
