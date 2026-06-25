import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/expedicao/separacao/$id')({
  component: ExpedicaoSeparacaoIdLayout,
});

function ExpedicaoSeparacaoIdLayout() {
  return <Outlet />;
}
