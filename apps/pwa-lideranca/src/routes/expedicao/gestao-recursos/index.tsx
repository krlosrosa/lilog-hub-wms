import { createFileRoute } from '@tanstack/react-router';

import { GestaoRecursosHubView } from '@/features/gestao-recursos/views/gestao-recursos-hub-view';

export const Route = createFileRoute('/expedicao/gestao-recursos/')({
  component: GestaoRecursosHubView,
});
