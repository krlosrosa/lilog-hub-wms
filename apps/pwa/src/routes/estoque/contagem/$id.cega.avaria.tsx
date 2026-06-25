import { createFileRoute } from '@tanstack/react-router';

import { ContagemAvariaView } from '@/features/estoque/views/contagem-avaria-view';

type CegaAvariaSearch = {
  endereco?: string;
  codigo?: string;
  itemId?: string;
};

export const Route = createFileRoute('/estoque/contagem/$id/cega/avaria')({
  validateSearch: (search: Record<string, unknown>): CegaAvariaSearch => ({
    endereco: typeof search.endereco === 'string' ? search.endereco : undefined,
    codigo: typeof search.codigo === 'string' ? search.codigo : undefined,
    itemId: typeof search.itemId === 'string' ? search.itemId : undefined,
  }),
  component: ContagemCegaAvariaRoute,
});

function ContagemCegaAvariaRoute() {
  const { id } = Route.useParams();
  const { endereco, codigo, itemId } = Route.useSearch();

  return (
    <ContagemAvariaView
      demandaId={id}
      origem="cega"
      endereco={endereco}
      codigoProduto={codigo}
      itemId={itemId}
    />
  );
}
