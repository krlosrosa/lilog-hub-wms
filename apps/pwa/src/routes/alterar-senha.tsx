import { createFileRoute } from '@tanstack/react-router';

import { AlterarSenhaView } from '@/features/auth/views/alterar-senha-view';

export const Route = createFileRoute('/alterar-senha')({
  component: AlterarSenhaView,
});
