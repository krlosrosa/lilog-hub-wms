import { FilialDetalheView } from '@/features/filiais';

export default function UnidadeDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  return <FilialDetalheView filialId={params.id} />;
}
