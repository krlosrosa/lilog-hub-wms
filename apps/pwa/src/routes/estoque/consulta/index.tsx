import { createFileRoute } from '@tanstack/react-router';

import { ConsultaProdutoView } from '@/features/estoque/views/consulta-produto-view';

export const Route = createFileRoute('/estoque/consulta/')({
  component: ConsultaProdutoView,
});
