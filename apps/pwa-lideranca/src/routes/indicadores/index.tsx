import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/indicadores/')({
  beforeLoad: () => {
    throw redirect({ to: '/expedicao/torre' });
  },
});
