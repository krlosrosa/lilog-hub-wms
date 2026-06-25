import { EnderecosConfiguracaoView } from '@/features/enderecos';

type EnderecoDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EnderecoDetalhePage({
  params,
}: EnderecoDetalhePageProps) {
  const { id } = await params;

  return <EnderecosConfiguracaoView enderecoId={id} />;
}
