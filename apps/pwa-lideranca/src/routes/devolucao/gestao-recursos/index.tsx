import { createFileRoute } from '@tanstack/react-router';

import { GestaoRecursosView } from '@/features/gestao-recursos/views/gestao-recursos-view';

export const Route = createFileRoute('/devolucao/gestao-recursos/')({
  component: () => (
    <GestaoRecursosView
      processo="devolucao"
      titulo="Devolução"
      backTo="/"
      backLabel="Voltar ao menu"
    />
  ),
});
