import { createFileRoute } from '@tanstack/react-router';

import { ContagemValidacaoView } from '@/features/estoque/views/contagem-validacao-view';

export const Route = createFileRoute('/estoque/contagem/$id/validacao/')({
  component: ContagemValidacaoRoute,
});

function ContagemValidacaoRoute() {
  const { id } = Route.useParams();
  return <ContagemValidacaoView demandaId={id} />;
}
