import { createFileRoute } from '@tanstack/react-router';

import { ConfirmacaoColetaView } from '@/features/movimentacao/views/confirmacao-coleta-view';

export const Route = createFileRoute(
  '/movimentacao/ressuprimento/$id/confirmacao-coleta',
)({
  component: ConfirmacaoColetaRoute,
});

function ConfirmacaoColetaRoute() {
  const { id } = Route.useParams();
  return <ConfirmacaoColetaView tarefaId={id} />;
}
