import { createFileRoute } from '@tanstack/react-router';

import { TarefasAtivasView } from '@/features/peso-variavel/views/tarefas-ativas-view';

export const Route = createFileRoute('/peso-variavel/')({
  component: TarefasAtivasView,
});
