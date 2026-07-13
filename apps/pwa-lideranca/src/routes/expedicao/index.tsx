import { createFileRoute } from '@tanstack/react-router';

import { ExpedicaoHubView } from '@/features/expedicao/views/expedicao-hub-view';

export const Route = createFileRoute('/expedicao/')({
  component: ExpedicaoHubView,
});
