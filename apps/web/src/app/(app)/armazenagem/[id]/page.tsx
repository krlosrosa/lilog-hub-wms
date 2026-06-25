import { redirect } from 'next/navigation';

type ArmazenagemDetalhePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArmazenagemDetalhePage({
  params,
}: ArmazenagemDetalhePageProps) {
  await params;
  redirect('/armazenagem');
}
