import { createFileRoute } from '@tanstack/react-router';

import { EstoqueView } from '@/features/estoque/views/estoque-view';

export const Route = createFileRoute('/estoque/')({
  component: EstoqueView,
});
