import { createFileRoute } from '@tanstack/react-router';

import { ListaDemandaView } from '@/features/devolucao/views/lista-demanda-view';

export const Route = createFileRoute('/devolucao/')({
  component: ListaDemandaView,
});
