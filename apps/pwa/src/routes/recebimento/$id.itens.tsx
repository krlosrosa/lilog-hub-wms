import { createFileRoute } from '@tanstack/react-router';

import { ListaItensView } from '@/features/recebimento/views/lista-itens-view';

export const Route = createFileRoute('/recebimento/$id/itens')({
  component: ListaItensRoute,
});

function ListaItensRoute() {
  const { id } = Route.useParams();
  return <ListaItensView demandId={id} />;
}
