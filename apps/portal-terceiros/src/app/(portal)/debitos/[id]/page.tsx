import { DebitoDetalheView } from '@/features/debitos/views/debito-detalhe-view';

type DebitoDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function DebitoDetalhePage({
  params,
}: DebitoDetalhePageProps) {
  const { id } = await params;
  return <DebitoDetalheView processoId={id} />;
}
