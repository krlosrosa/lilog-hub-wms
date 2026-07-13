import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/op-wms/gestao-recursos/')({
  beforeLoad: () => {
    throw redirect({ to: '/expedicao/gestao-recursos' });
  },
});
