import { createFileRoute } from '@tanstack/react-router';

import { ResumoDemandaRecuperacaoView } from '@/features/estoque/views/resumo-demanda-recuperacao-view';

export const Route = createFileRoute('/estoque/recuperacao/$demandaId/resumo')({
  component: ResumoDemandaRecuperacaoView,
});
