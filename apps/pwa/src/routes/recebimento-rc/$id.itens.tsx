import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { RequireChecklistRcGate } from '@/features/recebimento-rc/components/require-checklist-rc-gate';
import { ListaItensRcView } from '@/features/recebimento-rc/views/lista-itens-rc-view';

const searchSchema = z.object({
  fromChecklist: z
    .union([z.literal('1'), z.literal('true'), z.boolean()])
    .optional()
    .transform((value) => value === true || value === '1' || value === 'true'),
});

export const Route = createFileRoute('/recebimento-rc/$id/itens')({
  validateSearch: searchSchema,
  component: function ItensRcPage() {
    const { id } = Route.useParams();
    const { fromChecklist } = Route.useSearch();
    return (
      <RequireChecklistRcGate demandId={id} skipCheck={fromChecklist === true}>
        <ListaItensRcView demandId={id} />
      </RequireChecklistRcGate>
    );
  },
});
