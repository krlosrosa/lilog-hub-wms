import { DebitoDetalheView } from '@/features/debito-transportadora';

export default async function DebitoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DebitoDetalheView debitoId={id} />;
}
