import { createFileRoute } from '@tanstack/react-router';

import { ContagemAvariaView } from '@/features/estoque/views/contagem-avaria-view';

type ValidacaoAvariaSearch = {
  endereco?: string;
  itemId?: string;
};

export const Route = createFileRoute('/estoque/contagem/$id/validacao/avaria')({
  validateSearch: (search: Record<string, unknown>): ValidacaoAvariaSearch => ({
    endereco: typeof search.endereco === 'string' ? search.endereco : undefined,
    itemId: typeof search.itemId === 'string' ? search.itemId : undefined,
  }),
  component: ContagemValidacaoAvariaRoute,
});

function ContagemValidacaoAvariaRoute() {
  const { id } = Route.useParams();
  const { endereco, itemId } = Route.useSearch();

  return (
    <ContagemAvariaView
      demandaId={id}
      origem="validacao"
      endereco={endereco}
      itemId={itemId}
    />
  );
}
