import { CorteOperacionalDetalheView } from '@/features/corte-operacional';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CorteOperacionalDetalhePage({
  params,
}: PageProps) {
  const { id } = await params;
  return <CorteOperacionalDetalheView corteId={id} />;
}
