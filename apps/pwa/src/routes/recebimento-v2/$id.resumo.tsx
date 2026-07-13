import { createFileRoute } from '@tanstack/react-router';

import { ResumoV2View } from '@/features/recebimento-v2/views/resumo-v2-view';

export const Route = createFileRoute('/recebimento-v2/$id/resumo')({
  component: function ResumoPage() {
    const { id } = Route.useParams();
    return <ResumoV2View demandId={id} />;
  },
});
