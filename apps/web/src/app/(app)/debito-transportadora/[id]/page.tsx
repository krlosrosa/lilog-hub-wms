import { DebitoDetalheView } from '@/features/debito-transportadora';

export default function DebitoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  return <DebitoDetalheView debitoId={params.id} />;
}
