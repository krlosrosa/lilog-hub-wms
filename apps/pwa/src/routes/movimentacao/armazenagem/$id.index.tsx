import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ArmazenagemView } from '@/features/estoque/armazenagem/views/armazenagem-view';

const armazenagemDetalheSearchSchema = z.object({
  tarefaId: z.string().uuid().optional(),
  etiqueta: z.string().min(1).optional(),
});

type ArmazenagemDetalheSearch = z.infer<typeof armazenagemDetalheSearchSchema>;

export const Route = createFileRoute('/movimentacao/armazenagem/$id/')({
  validateSearch: (search: Record<string, unknown>): ArmazenagemDetalheSearch =>
    armazenagemDetalheSearchSchema.parse(search),
  component: ArmazenagemDetalheRoute,
});

function ArmazenagemDetalheRoute() {
  const { id } = Route.useParams();
  const { tarefaId, etiqueta } = Route.useSearch();

  return (
    <ArmazenagemView
      demandaId={id}
      scanMode="etiqueta"
      listaPath="/movimentacao/armazenagem"
      detalhePath="/movimentacao/armazenagem/$id"
      scanEntryFlow={Boolean(tarefaId && etiqueta)}
      initialTarefaId={tarefaId}
      prefilledEtiqueta={etiqueta}
    />
  );
}
