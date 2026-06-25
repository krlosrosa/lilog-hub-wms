import { createFileRoute } from '@tanstack/react-router';

import { ExpedicaoView } from '@/features/expedicao/views/expedicao-view';

export const Route = createFileRoute('/expedicao/')({
  component: ExpedicaoView,
});
