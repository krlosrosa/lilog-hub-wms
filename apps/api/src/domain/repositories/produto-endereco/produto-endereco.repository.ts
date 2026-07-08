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

export type SlottingSortColumn =
  | 'endereco'
  | 'zona'
  | 'tipo'
  | 'produto'
  | 'papel'
  | 'ordem'
  | 'status';

export type SlottingSortOrder = 'asc' | 'desc';

export type SlottingAlocacaoRecord = {
  id: string;
  produtoId: string;
  papel: ProdutoEnderecoPapel;
  ordem: number;
  ativo: boolean;
  produto: ProdutoEnderecoProdutoRecord;
};

export type SlottingEnderecoRecord = {
  enderecoId: string;
  enderecoMascarado: string;
  zona: string;
  rua: string;
  tipo: EnderecoTipo;
  alocacao: SlottingAlocacaoRecord | null;
};

export type ListSlottingProdutoEnderecosFilter = {
  page?: number;
  limit?: number;
  centroId: string;
  unidadeId?: string;
  tipo?: EnderecoTipo;
  search?: string;
  zonas?: string[];
  slotting?: 'com_produto' | 'sem_produto';
  papel?: ProdutoEnderecoPapel;
  ativo?: 'ativos' | 'inativos';
  searchProduto?: string;
  sortBy?: SlottingSortColumn;
  sortOrder?: SlottingSortOrder;
};

export type ListSlottingProdutoEnderecosResult = {
  items: SlottingEnderecoRecord[];
  total: number;
  page: number;
  limit: number;
};

export type UpsertBulkProdutoEnderecoResult = {
  inserted: number;
  updated: number;
};

export type GrupoComEnderecosRecord = {
  grupo: string;
  enderecoIds: string[];
};

export interface IProdutoEnderecoRepository {
  list(filter: ListProdutoEnderecosFilter): Promise<ListProdutoEnderecosResult>;
  listSlotting(
    filter: ListSlottingProdutoEnderecosFilter,
  ): Promise<ListSlottingProdutoEnderecosResult>;
  listGruposComEnderecos(
    centroId: string,
  ): Promise<GrupoComEnderecosRecord[]>;
  findById(id: string): Promise<ProdutoEnderecoRecord | null>;
  create(data: CreateProdutoEnderecoData): Promise<ProdutoEnderecoRecord>;
  update(
    id: string,
    data: UpdateProdutoEnderecoData,
  ): Promise<ProdutoEnderecoRecord | null>;
  delete(id: string): Promise<void>;
  upsertBulk(
    rows: CreateProdutoEnderecoData[],
  ): Promise<UpsertBulkProdutoEnderecoResult>;
}
