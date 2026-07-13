import { createFileRoute } from '@tanstack/react-router';

import { PreparacaoV2View } from '@/features/recebimento-v2/views/preparacao-v2-view';

export const Route = createFileRoute('/recebimento-v2/$id/preparacao')({
  component: function PreparacaoPage() {
    const { id } = Route.useParams();
    return <PreparacaoV2View demandId={id} />;
  },
});
