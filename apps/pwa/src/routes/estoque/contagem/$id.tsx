import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/estoque/contagem/$id')({
  component: EstoqueContagemIdLayout,
});

function EstoqueContagemIdLayout() {
  return <Outlet />;
}
