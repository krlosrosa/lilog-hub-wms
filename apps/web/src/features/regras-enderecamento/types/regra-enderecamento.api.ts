export type RegraEnderecamentoCriterioTipoApi =
  | 'grupo'
  | 'categoria'
  | 'produto';

export type RegraEnderecamentoDestinoTipoApi = 'zona' | 'endereco';

export type RegraEnderecamentoDestinoApi = {
  id: string;
  regraId: string;
  prioridade: number;
  tipo: RegraEnderecamentoDestinoTipoApi;
  zona: string | null;
  rua: string | null;
  enderecoId: string | null;
  enderecoLabel: string | null;
  ativo: boolean;
};

export type RegraEnderecamentoApi = {
  id: string;
  unidadeId: string;
  nome: string;
  criterioTipo: RegraEnderecamentoCriterioTipoApi;
  criterioValor: string;
  prioridade: number;
  ativo: boolean;
  destinos: RegraEnderecamentoDestinoApi[];
  createdAt: string;
  updatedAt: string;
};

export type ListRegrasEnderecamentoApiResponse = {
  items: RegraEnderecamentoApi[];
  total: number;
  page: number;
  limit: number;
};

export type ListRegrasEnderecamentoParams = {
  unidadeId: string;
  page?: number;
  limit?: number;
  criterioTipo?: RegraEnderecamentoCriterioTipoApi;
  ativo?: boolean;
  search?: string;
};

export type RegraEnderecamentoDestinoPayload = {
  prioridade: number;
  tipo: RegraEnderecamentoDestinoTipoApi;
  zona?: string;
  rua?: string;
  enderecoId?: string;
  ativo?: boolean;
};

export type CreateRegraEnderecamentoPayload = {
  unidadeId: string;
  nome: string;
  criterioTipo: RegraEnderecamentoCriterioTipoApi;
  criterioValor: string;
  prioridade?: number;
  ativo?: boolean;
  destinos: RegraEnderecamentoDestinoPayload[];
};

export type UpdateRegraEnderecamentoPayload = Partial<
  Omit<CreateRegraEnderecamentoPayload, 'unidadeId'>
>;
