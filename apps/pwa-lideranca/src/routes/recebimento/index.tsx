import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/recebimento/')({
  beforeLoad: () => {
    throw redirect({ to: '/recebimento/gestao-recursos' });
  },
});
