import { FilialDetalheView } from '@/features/filiais';

export default async function UnidadeDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <FilialDetalheView filialId={id} />;
}
