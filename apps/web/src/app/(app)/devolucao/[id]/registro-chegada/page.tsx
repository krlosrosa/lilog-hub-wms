import { DevolucaoRegistroChegadaView } from '@/features/devolucao';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DevolucaoRegistroChegadaPage({ params }: PageProps) {
  const { id } = await params;
  return <DevolucaoRegistroChegadaView demandId={id} />;
}
