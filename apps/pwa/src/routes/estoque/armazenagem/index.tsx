import { createFileRoute } from '@tanstack/react-router';

import { ListaArmazenagemView } from '@/features/estoque/armazenagem/views/lista-armazenagem-view';

export const Route = createFileRoute('/estoque/armazenagem/')({
  component: ListaArmazenagemView,
});
