import { createFileRoute } from '@tanstack/react-router';

import { ArmazenagemView } from '@/features/estoque/armazenagem/views/armazenagem-view';

export const Route = createFileRoute('/estoque/armazenagem/$id/')({
  component: ArmazenagemRoute,
});

function ArmazenagemRoute() {
  const { id } = Route.useParams();
  return <ArmazenagemView demandaId={id} />;
}
