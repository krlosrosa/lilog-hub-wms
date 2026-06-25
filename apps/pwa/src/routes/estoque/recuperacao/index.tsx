import { createFileRoute } from '@tanstack/react-router';

import { ListaDemandaRecuperacaoView } from '@/features/estoque/views/lista-demanda-recuperacao-view';

export const Route = createFileRoute('/estoque/recuperacao/')({
  component: ListaDemandaRecuperacaoView,
});
