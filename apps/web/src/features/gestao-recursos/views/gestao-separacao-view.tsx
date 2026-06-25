'use client';

import { GestaoRecursosView } from '@/features/gestao-recursos/views/gestao-recursos-view';

export function GestaoSeparacaoView() {
  return (
    <GestaoRecursosView
      processo="separacao"
      titulo="Monitoramento de Separação"
      breadcrumbAtual="Separação"
    />
  );
}
