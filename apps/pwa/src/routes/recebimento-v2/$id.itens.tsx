import { createFileRoute, redirect } from '@tanstack/react-router';

import { isChecklistCompleteForDemand, isDemandImpedida } from '@/features/recebimento-v2/lib/is-checklist-complete';
import { ListaItensV2View } from '@/features/recebimento-v2/views/lista-itens-v2-view';

export const Route = createFileRoute('/recebimento-v2/$id/itens')({
  beforeLoad: async ({ params }) => {
    if (await isDemandImpedida(params.id)) {
      throw redirect({
        to: '/recebimento-v2/$id/checklist',
        params: { id: params.id },
      });
    }

    const complete = await isChecklistCompleteForDemand(params.id);
    if (!complete) {
      throw redirect({
        to: '/recebimento-v2/$id/checklist',
        params: { id: params.id },
      });
    }
  },
  component: function ItensPage() {
    const { id } = Route.useParams();
    return <ListaItensV2View demandId={id} />;
  },
});
