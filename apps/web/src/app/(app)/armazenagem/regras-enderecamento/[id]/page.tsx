import { RegraEnderecamentoCadastroView } from '@/features/regras-enderecamento/views/regra-enderecamento-cadastro-view';

type EditarRegraEnderecamentoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarRegraEnderecamentoPage({
  params,
}: EditarRegraEnderecamentoPageProps) {
  const { id } = await params;
  return <RegraEnderecamentoCadastroView regraId={id} />;
}
