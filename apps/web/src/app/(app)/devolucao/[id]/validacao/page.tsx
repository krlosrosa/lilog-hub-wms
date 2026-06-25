import { DevolucaoValidacaoView } from '@/features/devolucao';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DevolucaoValidacaoPage({ params }: PageProps) {
  const { id } = await params;
  return <DevolucaoValidacaoView demandId={id} />;
}
