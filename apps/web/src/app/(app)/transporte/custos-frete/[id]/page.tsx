import { CustoFreteDetalheView } from '@/features/transporte';

type CustoFreteDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustoFreteDetalhePage({
  params,
}: CustoFreteDetalhePageProps) {
  const { id } = await params;

  return <CustoFreteDetalheView custoFreteId={id} />;
}
