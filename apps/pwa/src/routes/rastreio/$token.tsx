import { createFileRoute } from '@tanstack/react-router';

import { RastreioMotoristaView } from '@/features/rastreio/views/rastreio-motorista-view';

export const Route = createFileRoute('/rastreio/$token')({
  component: RastreioMotoristaView,
});
