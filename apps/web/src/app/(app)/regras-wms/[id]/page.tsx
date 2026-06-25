import { RegraWmsCadastroView } from '@/features/regras-wms';

type RegraWmsEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RegraWmsEditPage({
  params,
}: RegraWmsEditPageProps) {
  const { id } = await params;
  return <RegraWmsCadastroView regraId={id} />;
}
