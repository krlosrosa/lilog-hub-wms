import type { DocaSituacao, DocaTipo } from '@/features/docas/types/docas.schema';

export type DocaApi = {
  id: string;
  unidadeId: string;
  codigo: string;
  nome: string;
  tipo: DocaTipo;
  situacao: DocaSituacao;
  capacidadeVeiculos: number | null;
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListDocasApiResponse = {
  items: DocaApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateDocaPayload = {
  unidadeId: string;
  codigo: string;
  nome: string;
  tipo: DocaTipo;
  capacidadeVeiculos?: number;
  observacao?: string;
};

export type BulkCreateDocasPayload = {
  unidadeId: string;
  numeroInicial: number;
  numeroFinal: number;
  codigoPrefixo?: string;
  nomePrefixo?: string;
  tipo: DocaTipo;
  capacidadeVeiculos?: number;
  observacao?: string;
};

export type BulkCreateDocasApiResponse = {
  criadas: number;
  duplicadas: number;
  items: DocaApi[];
};

export type UpdateDocaPayload = Partial<{
  codigo: string;
  nome: string;
  tipo: DocaTipo;
  capacidadeVeiculos: number | null;
  observacao: string | null;
}>;

export type DocaActionPayload = {
  motivo?: string;
};

export type OperacaoDocaTipo =
  | 'recebimento'
  | 'expedicao'
  | 'transferencia'
  | 'cross_docking'
  | 'devolucao';

export type OperacaoDocaSituacao =
  | 'agendada'
  | 'aguardando_veiculo'
  | 'em_execucao'
  | 'finalizada'
  | 'cancelada';

export type OperacaoDocaPrioridade =
  | 'urgente'
  | 'prioritaria'
  | 'normal'
  | 'baixa';

export type OperacaoDocaApi = {
  id: string;
  docaId: string;
  tipoOperacao: OperacaoDocaTipo;
  veiculoId: string;
  transportadoraId: string;
  motorista: string | null;
  dataPrevista: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  situacao: OperacaoDocaSituacao;
  prioridade: OperacaoDocaPrioridade;
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListOperacoesDocaApiResponse = {
  items: OperacaoDocaApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateOperacaoDocaPayload = {
  tipoOperacao: OperacaoDocaTipo;
  veiculoId: string;
  transportadoraId: string;
  motorista?: string;
  dataPrevista?: string;
  prioridade?: OperacaoDocaPrioridade;
  observacao?: string;
};
