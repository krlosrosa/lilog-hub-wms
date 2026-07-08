import { createFileRoute } from '@tanstack/react-router';

import { ConclusaoView } from '@/features/movimentacao/views/conclusao-view';

export const Route = createFileRoute('/movimentacao/ressuprimento/$id/conclusao')({
  component: ConclusaoRoute,
});

function ConclusaoRoute() {
  const { id } = Route.useParams();
  return <ConclusaoView tarefaId={id} />;
}
