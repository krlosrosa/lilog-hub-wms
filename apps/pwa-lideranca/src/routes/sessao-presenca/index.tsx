import { createFileRoute } from '@tanstack/react-router';

import { SessoesListaView } from '@/features/sessao-presenca/views/sessoes-lista-view';

export const Route = createFileRoute('/sessao-presenca/')({
  component: SessoesListaView,
});
