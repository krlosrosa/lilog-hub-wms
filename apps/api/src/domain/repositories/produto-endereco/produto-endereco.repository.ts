import type {
  CreateProdutoEnderecoData,
  ProdutoEnderecoPapel,
  UpdateProdutoEnderecoData,
} from '../../model/produto-endereco/produto-endereco.model.js';
import type { EnderecoTipo } from '../../model/endereco/endereco.model.js';

export const PRODUTO_ENDERECO_REPOSITORY = 'IProdutoEnderecoRepository';

export type ProdutoEnderecoProdutoRecord = {
  sku: string;
  descricao: string;
  produtoId: string;
};

export type ProdutoEnderecoEnderecoRecord = {
  enderecoMascarado: string;
  tipo: EnderecoTipo;
  zona: string;
};

export type ProdutoEnderecoCentroRecord = {
  centro: string;
  nome: string;
  empresa: string;
};

export type ProdutoEnderecoRecord = {
  id: string;
  centroId: string;
  produtoId: string;
  enderecoId: string;
  papel: ProdutoEnderecoPapel;
  ordem: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
  produto: ProdutoEnderecoProdutoRecord;
  endereco: ProdutoEnderecoEnderecoRecord;
  centro: ProdutoEnderecoCentroRecord;
};

export type ListProdutoEnderecosFilter = {
  page?: number;
  limit?: number;
  centroId?: string;
  unidadeId?: string;
  produtoId?: string;
  papel?: ProdutoEnderecoPapel;
  ativo?: boolean;
  search?: string;
};

export type ListProdutoEnderecosResult = {
  items: ProdutoEnderecoRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface IProdutoEnderecoRepository {
  list(filter: ListProdutoEnderecosFilter): Promise<ListProdutoEnderecosResult>;
  findById(id: string): Promise<ProdutoEnderecoRecord | null>;
  create(data: CreateProdutoEnderecoData): Promise<ProdutoEnderecoRecord>;
  update(
    id: string,
    data: UpdateProdutoEnderecoData,
  ): Promise<ProdutoEnderecoRecord | null>;
  delete(id: string): Promise<void>;
}
