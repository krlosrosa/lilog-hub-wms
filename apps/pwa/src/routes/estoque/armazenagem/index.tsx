import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/estoque/armazenagem/')({
  beforeLoad: () => {
    throw redirect({ to: '/movimentacao/armazenagem' });
  },
});
