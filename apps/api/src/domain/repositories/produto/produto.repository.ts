import type {
  CreateProdutoInput,
  UpdateProdutoInput,
} from '../../model/produto/produto.model.js';

export const PRODUTO_REPOSITORY = 'IProdutoRepository';

export type ProdutoRecord = {
  id: string;
  produtoId: string;
  sku: string;
  descricao: string;
  empresa: CreateProdutoInput['empresa'];
  categoria: CreateProdutoInput['categoria'];
  tipo: CreateProdutoInput['tipo'];
  ean: string | null;
  dum: string | null;
  shelfLife: number | null;
  pesoBrutoUnidade: string | null;
  pesoBrutoCaixa: string | null;
  pesoBrutoPalete: string | null;
  pesoLiquidoUnidade: string | null;
  pesoLiquidoCaixa: string | null;
  pesoLiquidoPalete: string | null;
  unidadesPorCaixa: number | null;
  caixasPorPalete: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListProdutosFilter = {
  page?: number;
  limit?: number;
  categoria?: CreateProdutoInput['categoria'];
  search?: string;
  empresa?: CreateProdutoInput['empresa'];
  tipo?: CreateProdutoInput['tipo'];
  ean?: 'com' | 'sem';
  dum?: 'com' | 'sem';
};

export type ListProdutosResult = {
  items: ProdutoRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface IProdutoRepository {
  list(filter: ListProdutosFilter): Promise<ListProdutosResult>;
  findById(id: string): Promise<ProdutoRecord | null>;
  findBySku(sku: string): Promise<ProdutoRecord | null>;
  findByProdutoId(produtoId: string): Promise<ProdutoRecord | null>;
  findByCodigosRemessa(codigos: string[]): Promise<Map<string, ProdutoRecord | null>>;
  create(data: CreateProdutoInput): Promise<ProdutoRecord>;
  bulkCreate(items: CreateProdutoInput[]): Promise<{ importados: number; duplicados: number }>;
  update(id: string, data: UpdateProdutoInput): Promise<ProdutoRecord | null>;
  delete(id: string): Promise<void>;
}
