import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/estoque/armazenagem/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/movimentacao/armazenagem/$id',
      params: { id: params.id },
    });
  },
});
