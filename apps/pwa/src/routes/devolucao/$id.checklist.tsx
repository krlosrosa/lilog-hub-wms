import { createFileRoute } from '@tanstack/react-router';

import { ChecklistView } from '@/features/devolucao/views/checklist-view';

export const Route = createFileRoute('/devolucao/$id/checklist')({
  component: ChecklistRoute,
});

function ChecklistRoute() {
  const { id } = Route.useParams();
  return <ChecklistView demandId={id} />;
}
