import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/estoque/contagem/$id/cega')({
  component: ContagemCegaLayout,
});

function ContagemCegaLayout() {
  return <Outlet />;
}
