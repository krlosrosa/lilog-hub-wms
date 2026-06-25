import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/recebimento/$id')({
  component: RecebimentoIdLayout,
});

function RecebimentoIdLayout() {
  return <Outlet />;
}
