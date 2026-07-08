import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/movimentacao/ressuprimento/$id')({
  component: RessuprimentoIdLayout,
});

function RessuprimentoIdLayout() {
  return <Outlet />;
}
