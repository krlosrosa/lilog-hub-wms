import { createFileRoute } from '@tanstack/react-router';

import { AvariaView } from '@/features/recebimento/views/avaria-view';

export const Route = createFileRoute('/recebimento/$id/avaria')({
  component: AvariaRoute,
});

function AvariaRoute() {
  const { id } = Route.useParams();
  return <AvariaView demandId={id} />;
}
