import { createFileRoute } from '@tanstack/react-router';

import { AcessoNegadoView } from '@/features/auth/views/acesso-negado-view';

export const Route = createFileRoute('/acesso-negado')({
  component: AcessoNegadoView,
});
