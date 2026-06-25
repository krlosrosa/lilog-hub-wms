import { createFileRoute } from '@tanstack/react-router';

import { SeparacaoView } from '@/features/expedicao/views/separacao-view';

export const Route = createFileRoute('/expedicao/separacao/$id/')({
  component: SeparacaoRoute,
});

function SeparacaoRoute() {
  const { id } = Route.useParams();
  return <SeparacaoView ordemId={id} />;
}
