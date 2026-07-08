import { DevolucaoGrupoDetalheView } from '@/features/devolucao';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DevolucaoGrupoDetalhePage({ params }: PageProps) {
  const { id } = await params;
  return <DevolucaoGrupoDetalheView id={id} />;
}
