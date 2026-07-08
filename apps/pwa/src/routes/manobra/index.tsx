import { createFileRoute } from '@tanstack/react-router';

import { ManobraView } from '@/features/manobra/views/manobra-view';

export const Route = createFileRoute('/manobra/')({
  component: ManobraRoute,
});

function ManobraRoute() {
  return <ManobraView />;
}
