import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RegrasExpedicaoIdRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/config-operacional/regras-produtividade/${id}?tipo=separacao`);
}
