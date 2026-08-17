import { createFileRoute } from '@tanstack/react-router';

import { ChecklistRcView } from '@/features/recebimento-rc/views/checklist-rc-view';

export const Route = createFileRoute('/recebimento-rc/$id/checklist')({
  component: function ChecklistRcPage() {
    const { id } = Route.useParams();
    return <ChecklistRcView demandId={id} />;
  },
});
