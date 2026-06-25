import { RecebimentoDetalheView } from '@/features/recebimento';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecebimentoDetalhePage({ params }: PageProps) {
  const { id } = await params;
  return <RecebimentoDetalheView recebimentoId={id} />;
}
