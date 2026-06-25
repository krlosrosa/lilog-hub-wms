import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/movimentacao/$id')({
  component: MovimentacaoIdLayout,
});

function MovimentacaoIdLayout() {
  return <Outlet />;
}
