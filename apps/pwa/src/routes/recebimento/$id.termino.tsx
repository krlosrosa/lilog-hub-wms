import { createFileRoute } from '@tanstack/react-router';

import { TerminoProcessoView } from '@/features/recebimento/views/termino-processo-view';

export const Route = createFileRoute('/recebimento/$id/termino')({
  component: TerminoProcessoRoute,
});

function TerminoProcessoRoute() {
  const { id } = Route.useParams();
  return <TerminoProcessoView demandId={id} />;
}
