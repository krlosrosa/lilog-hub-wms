import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { isChecklistCompleteForDemand, isDemandImpedida } from '@/features/recebimento-v2/lib/is-checklist-complete';
import { ChecklistV2View } from '@/features/recebimento-v2/views/checklist-v2-view';

const searchSchema = z.object({
  view: z
    .union([z.literal('1'), z.literal('true'), z.boolean()])
    .optional()
    .transform((value) => value === true || value === '1' || value === 'true'),
});

export const Route = createFileRoute('/recebimento-v2/$id/checklist')({
  validateSearch: searchSchema,
  beforeLoad: async ({ params, search }) => {
    if (search.view) return;

    if (await isDemandImpedida(params.id)) {
      return;
    }

    const complete = await isChecklistCompleteForDemand(params.id);
    if (complete) {
      throw redirect({
        to: '/recebimento-v2/$id/itens',
        params: { id: params.id },
      });
    }
  },
  component: function ChecklistPage() {
    const { id } = Route.useParams();
    const { view } = Route.useSearch();
    return <ChecklistV2View demandId={id} viewOnly={view} />;
  },
});
