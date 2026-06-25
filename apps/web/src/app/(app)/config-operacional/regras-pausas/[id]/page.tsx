import { RegraPausaFormView } from '@/features/regras-pausas';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarRegraPausaPage({ params }: PageProps) {
  const { id } = await params;
  return <RegraPausaFormView regraId={id} />;
}
