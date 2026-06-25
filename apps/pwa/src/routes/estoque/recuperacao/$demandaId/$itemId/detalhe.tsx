import { createFileRoute } from '@tanstack/react-router';

import { DetalheRecuperacaoView } from '@/features/estoque/views/detalhe-recuperacao-view';

export const Route = createFileRoute(
  '/estoque/recuperacao/$demandaId/$itemId/detalhe',
)({
  component: DetalheRecuperacaoView,
});
