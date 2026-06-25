import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/estoque/contagem/$id/validacao')({
  component: ContagemValidacaoLayout,
});

function ContagemValidacaoLayout() {
  return <Outlet />;
}
