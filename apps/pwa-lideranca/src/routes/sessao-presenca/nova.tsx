import { createFileRoute } from '@tanstack/react-router';

import { SessaoNovaView } from '@/features/sessao-presenca/views/sessao-nova-view';

export const Route = createFileRoute('/sessao-presenca/nova')({
  component: SessaoNovaView,
});
