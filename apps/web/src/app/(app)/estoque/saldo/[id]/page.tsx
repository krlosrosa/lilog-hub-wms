import { SaldoDetalheView } from '@/features/estoque/views/saldo-detalhe-view';

type SaldoDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SaldoDetalhePage({ params }: SaldoDetalhePageProps) {
  const { id } = await params;

  return <SaldoDetalheView saldoEnderecoId={id} />;
}
