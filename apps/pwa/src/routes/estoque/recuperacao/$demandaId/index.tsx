import { createFileRoute } from '@tanstack/react-router';

import { ListaProdutoRecuperacaoView } from '@/features/estoque/views/lista-produto-recuperacao-view';

export const Route = createFileRoute('/estoque/recuperacao/$demandaId/')({
  component: ListaProdutoRecuperacaoView,
});
