import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/estoque/recuperacao/$demandaId/$itemId')({
  component: RecuperacaoItemLayout,
});

function RecuperacaoItemLayout() {
  return <Outlet />;
}
