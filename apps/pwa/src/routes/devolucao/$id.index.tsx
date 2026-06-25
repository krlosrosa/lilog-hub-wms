import { createFileRoute } from '@tanstack/react-router';

import { DetalheItemView } from '@/features/devolucao/views/detalhe-item-view';

export const Route = createFileRoute('/devolucao/$id/')({
  component: ConferenciaRoute,
});

function ConferenciaRoute() {
  const { id } = Route.useParams();
  return <DetalheItemView demandId={id} />;
}
