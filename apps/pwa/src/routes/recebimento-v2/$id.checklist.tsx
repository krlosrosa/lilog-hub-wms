import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { isChecklistCompleteForDemand, isDemandImpedida } from '@/features/recebimento-v2/lib/is-checklist-complete';
import { useProcessCapabilitiesV2 } from '@/features/recebimento-v2/hooks/use-process-capabilities-v2';
import { ChecklistV2View } from '@/features/recebimento-v2/views/checklist-v2-view';

const searchSchema = z.object({
  view: z
    .union([z.literal('1'), z.literal('true'), z.boolean()])
    .optional()
    .transform((value) => value === true || value === '1' || value === 'true'),
});

function ChecklistPageContent({
  demandId,
  viewParam,
}: {
  demandId: string;
  viewParam?: boolean;
}) {
  const { capabilities } = useProcessCapabilitiesV2(demandId);

  return (
    <ChecklistV2View
      demandId={demandId}
      viewOnly={viewParam === true || !capabilities.canEditChecklist}
    />
  );
}

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
    return <ChecklistPageContent demandId={id} viewParam={view} />;
  },
});
