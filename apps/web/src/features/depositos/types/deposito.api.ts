export type DepositoFinalidade =
  | 'transferencia'
  | 'aguardando_armazenagem'
  | 'geral'
  | 'quarentena'
  | 'debito_transportadora'
  | 'acerto_transferencia'
  | 'reserva'
  | 'avaria'
  | 'bloqueado';

export type DepositoApi = {
  id: string;
  unidadeId: string;
  codigo: string;
  nome: string;
  finalidade: DepositoFinalidade;
  permiteVenda: boolean;
  permitePicking: boolean;
  exigeEndereco: boolean;
  contaDisponivel: boolean;
  sistema: boolean;
  ativo: boolean;
};

export type ListDepositosApiResponse = {
  items: DepositoApi[];
};

export type CreateDepositoPayload = {
  unidadeId: string;
  codigo: string;
  nome: string;
  finalidade: DepositoFinalidade;
  permiteVenda: boolean;
  permitePicking: boolean;
  exigeEndereco: boolean;
  contaDisponivel: boolean;
};

export type UpdateDepositoPayload = {
  nome?: string;
  permiteVenda?: boolean;
  permitePicking?: boolean;
  exigeEndereco?: boolean;
  contaDisponivel?: boolean;
  ativo?: boolean;
};
