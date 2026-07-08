import { ProdutoCadastroView } from '@/features/produto';

type ProdutoEditPageProps = {
  params: Promise<{ produtoId: string }>;
};

export default async function ProdutoEditPage({ params }: ProdutoEditPageProps) {
  const { produtoId } = await params;
  return <ProdutoCadastroView produtoId={produtoId} />;
}
