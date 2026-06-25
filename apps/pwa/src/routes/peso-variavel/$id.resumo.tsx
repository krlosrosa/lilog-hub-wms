import { createFileRoute } from '@tanstack/react-router';

import { ResumoPickingView } from '@/features/peso-variavel/views/resumo-picking-view';

export const Route = createFileRoute('/peso-variavel/$id/resumo')({
  component: ResumoPickingView,
});
