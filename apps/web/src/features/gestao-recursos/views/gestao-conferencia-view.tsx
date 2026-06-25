'use client';

import { GestaoRecursosView } from '@/features/gestao-recursos/views/gestao-recursos-view';

export function GestaoConferenciaView() {
  return (
    <GestaoRecursosView
      processo="conferencia"
      titulo="Monitoramento de Conferência"
      breadcrumbAtual="Conferência"
    />
  );
}
