import { createFileRoute } from '@tanstack/react-router';

import { ResumoTurnoView } from '@/features/passagem-bastao/views/resumo-turno-view';

export const Route = createFileRoute('/passagem-bastao/resumo')({
  component: ResumoTurnoView,
});
