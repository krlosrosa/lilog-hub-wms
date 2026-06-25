import { FrotaDetalhesView } from '@/features/frota';

type FrotaDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function FrotaDetalhePage({ params }: FrotaDetalhePageProps) {
  const { id } = await params;
  return <FrotaDetalhesView veiculoId={id} />;
}
