import { createFileRoute } from '@tanstack/react-router';

import { ChecklistView } from '@/features/recebimento/views/checklist-view';

export const Route = createFileRoute('/recebimento/$id/checklist')({
  component: ChecklistRoute,
});

function ChecklistRoute() {
  const { id } = Route.useParams();
  return <ChecklistView demandId={id} />;
}
