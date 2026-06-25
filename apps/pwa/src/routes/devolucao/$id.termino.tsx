import { createFileRoute } from '@tanstack/react-router';

import { TerminoProcessoView } from '@/features/devolucao/views/termino-processo-view';

export const Route = createFileRoute('/devolucao/$id/termino')({
  component: TerminoProcessoRoute,
});

function TerminoProcessoRoute() {
  const { id } = Route.useParams();
  return <TerminoProcessoView demandId={id} />;
}
