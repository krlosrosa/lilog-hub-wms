import { createFileRoute } from '@tanstack/react-router';

import { MovimentacaoHubView } from '@/features/movimentacao/views/movimentacao-hub-view';

export const Route = createFileRoute('/movimentacao/')({
  component: MovimentacaoHubView,
});
