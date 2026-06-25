import { createFileRoute } from '@tanstack/react-router';

import { DetalheItemView } from '@/features/recebimento/views/detalhe-item-view';

type ConferenciaSearch = {
  init?: string;
};

export const Route = createFileRoute('/recebimento/$id/')({
  validateSearch: (search: Record<string, unknown>): ConferenciaSearch => ({
    init: typeof search.init === 'string' ? search.init : undefined,
  }),
  component: ConferenciaRoute,
});

function ConferenciaRoute() {
  const { id } = Route.useParams();
  const { init } = Route.useSearch();

  return <DetalheItemView demandId={id} initKey={init} />;
}
