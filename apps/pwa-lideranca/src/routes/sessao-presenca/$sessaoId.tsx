import { createFileRoute } from '@tanstack/react-router';

import { SessaoPresencaView } from '@/features/sessao-presenca/views/sessao-presenca-view';

export const Route = createFileRoute('/sessao-presenca/$sessaoId')({
  component: SessaoPresencaRoute,
});

function SessaoPresencaRoute() {
  const { sessaoId } = Route.useParams();
  return <SessaoPresencaView sessaoId={sessaoId} />;
}
