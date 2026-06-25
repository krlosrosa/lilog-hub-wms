import { createFileRoute } from '@tanstack/react-router';

import { ListaDemandaView } from '@/features/recebimento/views/lista-demanda-view';

export const Route = createFileRoute('/recebimento/')({
  component: ListaDemandaView,
});
