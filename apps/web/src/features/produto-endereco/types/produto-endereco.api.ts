export type ProdutoEnderecoPapel =
  | 'picking_primario'
  | 'picking_secundario'
  | 'pulmao';

export type ProdutoEnderecoApi = {
  id: string;
  centroId: string;
  produtoId: string;
  enderecoId: string;
  papel: ProdutoEnderecoPapel;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  produto: {
    sku: string;
    descricao: string;
    produtoId: string;
  };
  endereco: {
    enderecoMascarado: string;
    tipo: string;
    zona: string;
  };
  centro: {
    centro: string;
    nome: string;
    empresa: string;
  };
};

export type ListProdutoEnderecosApiResponse = {
  items: ProdutoEnderecoApi[];
  total: number;
  page: number;
  limit: number;
};

export type ListProdutoEnderecosParams = {
  page?: number;
  limit?: number;
  centroId?: string;
  unidadeId?: string;
  produtoId?: string;
  papel?: ProdutoEnderecoPapel;
  ativo?: boolean;
  search?: string;
};

export type CreateProdutoEnderecoPayload = {
  centroId: string;
  produtoId: string;
  enderecoId: string;
  papel: ProdutoEnderecoPapel;
  ordem?: number;
  ativo?: boolean;
};

export type UpdateProdutoEnderecoPayload = {
  enderecoId?: string;
  papel?: ProdutoEnderecoPapel;
  ordem?: number;
  ativo?: boolean;
};

export type ExportProdutoEnderecosParams = {
  centroId: string;
  unidadeId?: string;
  tipo?: 'picking' | 'pulmao' | 'aereo';
  search?: string;
  slotting?: 'com_produto' | 'sem_produto';
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

export type SlottingAlocacaoApi = {
  id: string;
  produtoId: string;
  papel: ProdutoEnderecoPapel;
  ordem: number;
  ativo: boolean;
  produto: {
    sku: string;
    descricao: string;
    produtoId: string;
  };
};

export type SlottingEnderecoApi = {
  enderecoId: string;
  enderecoMascarado: string;
  zona: string;
  rua: string;
  tipo: string;
  alocacao: SlottingAlocacaoApi | null;
};

export type ListSlottingProdutoEnderecosApiResponse = {
  items: SlottingEnderecoApi[];
  total: number;
  page: number;
  limit: number;
};

export type ListSlottingProdutoEnderecosParams = {
  page?: number;
  limit?: number;
  centroId: string;
  unidadeId?: string;
  tipo?: 'picking' | 'pulmao' | 'aereo';
  search?: string;
  zonas?: string[];
  slotting?: 'com_produto' | 'sem_produto';
  papel?: ProdutoEnderecoPapel;
  ativo?: 'ativos' | 'inativos';
  searchProduto?: string;
  sortBy?: SlottingSortColumn;
  sortOrder?: SlottingSortOrder;
};

export type ErroImportacaoProdutoEndereco = {
  linha: number;
  endereco: string;
  sku: string;
  campo: string;
  mensagem: string;
};

export type ImportProdutoEnderecosResponse = {
  total: number;
  inserted: number;
  updated: number;
  errors: ErroImportacaoProdutoEndereco[];
};

export type GrupoComEnderecosApi = {
  grupo: string;
  enderecoIds: string[];
};
