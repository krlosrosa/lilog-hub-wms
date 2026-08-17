import { createFileRoute } from '@tanstack/react-router';

import { ResumoRcView } from '@/features/recebimento-rc/views/resumo-rc-view';

export const Route = createFileRoute('/recebimento-rc/$id/resumo')({
  component: function ResumoRcPage() {
    const { id } = Route.useParams();
    return <ResumoRcView demandId={id} />;
  },
});
