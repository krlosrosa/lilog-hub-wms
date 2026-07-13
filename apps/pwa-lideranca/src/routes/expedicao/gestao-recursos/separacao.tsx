import { createFileRoute } from '@tanstack/react-router';

import { GestaoRecursosView } from '@/features/gestao-recursos/views/gestao-recursos-view';

export const Route = createFileRoute('/expedicao/gestao-recursos/separacao')({
  component: () => (
    <GestaoRecursosView
      processo="separacao"
      titulo="Separação"
      backTo="/expedicao/gestao-recursos"
      backLabel="Voltar aos processos"
    />
  ),
});
