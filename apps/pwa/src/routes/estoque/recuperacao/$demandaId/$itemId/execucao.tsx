import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/estoque/recuperacao/$demandaId/$itemId/execucao',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/estoque/recuperacao/$demandaId/$itemId/detalhe',
      params: {
        demandaId: params.demandaId,
        itemId: params.itemId,
      },
    });
  },
});
