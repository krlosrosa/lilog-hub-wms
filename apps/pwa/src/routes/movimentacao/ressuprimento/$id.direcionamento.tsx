import { createFileRoute } from '@tanstack/react-router';

import { DirecionamentoView } from '@/features/movimentacao/views/direcionamento-view';

export const Route = createFileRoute(
  '/movimentacao/ressuprimento/$id/direcionamento',
)({
  component: DirecionamentoRoute,
});

function DirecionamentoRoute() {
  const { id } = Route.useParams();
  return <DirecionamentoView tarefaId={id} />;
}
