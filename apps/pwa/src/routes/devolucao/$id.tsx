import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/devolucao/$id')({
  component: DevolucaoIdLayout,
});

function DevolucaoIdLayout() {
  return <Outlet />;
}
