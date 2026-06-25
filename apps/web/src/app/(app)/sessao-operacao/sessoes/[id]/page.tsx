import { SessaoDetalheView } from '@/features/sessao-operacao';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessaoDetalhePage({ params }: PageProps) {
  const { id } = await params;
  return <SessaoDetalheView sessaoId={id} />;
}
