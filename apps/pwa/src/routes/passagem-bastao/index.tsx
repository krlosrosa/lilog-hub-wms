import { createFileRoute } from '@tanstack/react-router';

import { ChecklistTurnoView } from '@/features/passagem-bastao/views/checklist-turno-view';

export const Route = createFileRoute('/passagem-bastao/')({
  component: ChecklistTurnoView,
});
