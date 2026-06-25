import { createFileRoute } from '@tanstack/react-router';

import { ContagemCegaView } from '@/features/estoque/views/contagem-cega-view';

export const Route = createFileRoute('/estoque/contagem/$id/cega/')({
  component: ContagemCegaRoute,
});

function ContagemCegaRoute() {
  const { id } = Route.useParams();
  return <ContagemCegaView demandaId={id} />;
}
