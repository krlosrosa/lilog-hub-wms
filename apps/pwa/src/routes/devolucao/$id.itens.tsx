import { createFileRoute } from '@tanstack/react-router';

import { ListaItensView } from '@/features/devolucao/views/lista-itens-view';

export const Route = createFileRoute('/devolucao/$id/itens')({
  component: ListaItensRoute,
});

function ListaItensRoute() {
  const { id } = Route.useParams();
  return <ListaItensView demandId={id} />;
}
