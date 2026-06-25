import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/estoque/armazenagem/$id')({
  component: EstoqueArmazenagemIdLayout,
});

function EstoqueArmazenagemIdLayout() {
  return <Outlet />;
}
