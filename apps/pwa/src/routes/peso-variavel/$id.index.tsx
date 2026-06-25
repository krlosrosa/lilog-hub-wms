import { createFileRoute } from '@tanstack/react-router';

import { CadastroPickingView } from '@/features/peso-variavel/views/cadastro-picking-view';

export const Route = createFileRoute('/peso-variavel/$id/')({
  component: CadastroPickingView,
});
