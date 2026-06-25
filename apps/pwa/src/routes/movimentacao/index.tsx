import { createFileRoute } from '@tanstack/react-router';

import { ListaTarefasView } from '@/features/movimentacao/views/lista-tarefas-view';

export const Route = createFileRoute('/movimentacao/')({
  component: ListaTarefasView,
});
