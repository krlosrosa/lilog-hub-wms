import { ProdutoCadastroView } from '@/features/produto';

type ProdutoEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProdutoEditPage({ params }: ProdutoEditPageProps) {
  const { id } = await params;
  return <ProdutoCadastroView produtoId={id} />;
}
