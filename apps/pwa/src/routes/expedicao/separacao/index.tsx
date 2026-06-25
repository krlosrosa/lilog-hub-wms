import { createFileRoute } from '@tanstack/react-router';

import { ListaSeparacaoView } from '@/features/expedicao/views/lista-separacao-view';

export const Route = createFileRoute('/expedicao/separacao/')({
  component: ListaSeparacaoView,
});
