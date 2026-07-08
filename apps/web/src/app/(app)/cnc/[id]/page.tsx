import { CncDetalheView } from '@/features/cnc';

export default async function CncDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CncDetalheView cncId={id} />;
}
