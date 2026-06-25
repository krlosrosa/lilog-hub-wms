import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/estoque/recuperacao/$demandaId')({
  component: RecuperacaoDemandaLayout,
});

function RecuperacaoDemandaLayout() {
  return <Outlet />;
}
