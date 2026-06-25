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
