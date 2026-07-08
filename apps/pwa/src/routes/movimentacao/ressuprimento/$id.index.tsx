import { createFileRoute } from '@tanstack/react-router';

import { ArmazenagemView } from '@/features/estoque/armazenagem/views/armazenagem-view';

export const Route = createFileRoute('/movimentacao/ressuprimento/$id/')({
  component: RessuprimentoDetalheRoute,
});

function RessuprimentoDetalheRoute() {
  const { id } = Route.useParams();

  return (
    <ArmazenagemView
      demandaId={id}
      scanMode="etiqueta"
      listaPath="/movimentacao/ressuprimento"
      detalhePath="/movimentacao/ressuprimento/$id"
    />
  );
}
