import { createFileRoute } from '@tanstack/react-router';

import { AvariaView } from '@/features/devolucao/views/avaria-view';

export const Route = createFileRoute('/devolucao/$id/avaria')({
  component: AvariaRoute,
});

function AvariaRoute() {
  const { id } = Route.useParams();
  return <AvariaView demandId={id} />;
}
