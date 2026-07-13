import { createFileRoute } from '@tanstack/react-router';

import { GestaoRecursosView } from '@/features/gestao-recursos/views/gestao-recursos-view';

export const Route = createFileRoute('/expedicao/gestao-recursos/conferencia')({
  component: () => (
    <GestaoRecursosView
      processo="conferencia"
      titulo="Conferência"
      backTo="/expedicao/gestao-recursos"
      backLabel="Voltar aos processos"
    />
  ),
});
