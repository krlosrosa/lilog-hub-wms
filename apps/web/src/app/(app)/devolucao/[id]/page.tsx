import { DevolucaoDetalhesView } from '@/features/devolucao';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DevolucaoDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  return <DevolucaoDetalhesView id={id} />;
}
