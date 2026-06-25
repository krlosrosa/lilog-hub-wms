import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RegrasConferenciaIdRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/config-operacional/regras-produtividade/${id}?tipo=conferencia`);
}
