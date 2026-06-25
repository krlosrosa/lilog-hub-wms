export const DOCA_EVENT = {
  CADASTRADA: 'DOCA_CADASTRADA',
  BLOQUEADA: 'DOCA_BLOQUEADA',
  DESBLOQUEADA: 'DOCA_DESBLOQUEADA',
  ENTROU_MANUTENCAO: 'DOCA_ENTROU_MANUTENCAO',
  OPERACAO_AGENDADA: 'OPERACAO_AGENDADA',
  OPERACAO_INICIADA: 'OPERACAO_INICIADA',
  OPERACAO_FINALIZADA: 'OPERACAO_FINALIZADA',
  OPERACAO_CANCELADA: 'OPERACAO_CANCELADA',
  VEICULO_CHEGOU: 'VEICULO_CHEGOU',
  VEICULO_LIBERADO: 'VEICULO_LIBERADO',
} as const;

export type DocaEventType = (typeof DOCA_EVENT)[keyof typeof DOCA_EVENT];

export type DocaDomainEvent = {
  type: DocaEventType;
  docaId: string;
  unidadeId: string;
  operacaoId?: string;
  userId: number | null;
  motivo?: string;
  metadata?: Record<string, unknown>;
};
