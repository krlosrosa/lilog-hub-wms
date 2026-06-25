import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/peso-variavel/$id')({
  component: PesoVariavelIdLayout,
});

function PesoVariavelIdLayout() {
  return <Outlet />;
}
