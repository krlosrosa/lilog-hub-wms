import { createFileRoute } from '@tanstack/react-router';

import { GestaoRecursosView } from '@/features/gestao-recursos/views/gestao-recursos-view';

export const Route = createFileRoute('/op-wms/gestao-recursos/')({
  component: GestaoRecursosView,
});
