import { ClienteEspecialCadastroView } from '@/features/cliente-especial-expedicao/views/cliente-especial-cadastro-view';

export default async function EditarClienteEspecialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClienteEspecialCadastroView clienteId={id} />;
}
