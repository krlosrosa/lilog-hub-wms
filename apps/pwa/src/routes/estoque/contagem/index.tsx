import { createFileRoute } from '@tanstack/react-router';

import { ListaDemandaView } from '@/features/estoque/views/lista-demanda-view';

export const Route = createFileRoute('/estoque/contagem/')({
  component: ListaDemandaView,
});
