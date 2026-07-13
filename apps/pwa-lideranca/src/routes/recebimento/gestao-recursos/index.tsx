import { createFileRoute } from '@tanstack/react-router';

import { GestaoRecursosRecebimentoView } from '@/features/gestao-recursos-recebimento/views/gestao-recursos-recebimento-view';

export const Route = createFileRoute('/recebimento/gestao-recursos/')({
  component: GestaoRecursosRecebimentoView,
});
