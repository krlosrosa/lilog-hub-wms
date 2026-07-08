import type {
  FiltroCategoriaProduto,
  ProdutoCategoria,
} from '@/features/produto/types/produto-lista.schema';
import type { TipoProduto } from '@/features/produto/types/produto.schema';

export type EmpresaProdutoApi = 'ITB' | 'LDB' | 'DPA';

export type ProdutoApi = {
  produtoId: string;
  sku: string;
  descricao: string;
  empresa: EmpresaProdutoApi;
  categoria: ProdutoCategoria;
  grupo?: string | null;
  tipo: TipoProduto;
  ean?: string | null;
  dum?: string | null;
  shelfLife?: number | null;
  pesoBrutoUnidade?: string | null;
  pesoBrutoCaixa?: string | null;
  pesoBrutoPalete?: string | null;
  pesoLiquidoUnidade?: string | null;
  pesoLiquidoCaixa?: string | null;
  pesoLiquidoPalete?: string | null;
  unidadesPorCaixa?: number | null;
  caixasPorPalete?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProdutoPayload = {
  produtoId: string;
  sku: string;
  descricao: string;
  empresa: EmpresaProdutoApi;
  categoria: ProdutoCategoria;
  grupo?: string | null;
  tipo: TipoProduto;
  ean?: string;
  dum?: string;
  shelfLife?: number | null;
  pesoBrutoUnidade?: string | null;
  pesoBrutoCaixa?: string | null;
  pesoBrutoPalete?: string | null;
  unidadesPorCaixa?: number | null;
  caixasPorPalete?: number | null;
};

export type UpdateProdutoPayload = Partial<CreateProdutoPayload>;

export type ErroImportacaoProduto = {
  linha: number;
  sku: string;
  campo: string;
  mensagem: string;
};

export type ImportacaoMassaResponse = {
  total: number;
  importados: number;
  duplicados: number;
  erros: ErroImportacaoProduto[];
};

export type ListProdutosApiResponse = {
  items: ProdutoApi[];
  total: number;
  page: number;
  limit: number;
};

export type ListProdutosParams = {
  page?: number;
  limit?: number;
  categoria?: FiltroCategoriaProduto;
  search?: string;
  empresa?: EmpresaProdutoApi;
  tipo?: TipoProduto;
  ean?: 'com' | 'sem';
  dum?: 'com' | 'sem';
};
