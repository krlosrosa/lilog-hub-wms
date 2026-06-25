export const ENDERECO_EVENT = {
  CRIADO: 'ENDERECO_CRIADO',
  ATUALIZADO: 'ENDERECO_ATUALIZADO',
  INATIVADO: 'ENDERECO_INATIVADO',
  BLOQUEADO: 'ENDERECO_BLOQUEADO',
  DESBLOQUEADO: 'ENDERECO_DESBLOQUEADO',
  OCUPADO: 'ENDERECO_OCUPADO',
  LIBERADO: 'ENDERECO_LIBERADO',
  ENTROU_INVENTARIO: 'ENDERECO_ENTROU_INVENTARIO',
  SAIU_INVENTARIO: 'ENDERECO_SAIU_INVENTARIO',
} as const;

export type EnderecoEventType =
  (typeof ENDERECO_EVENT)[keyof typeof ENDERECO_EVENT];

export type EnderecoDomainEvent = {
  type: EnderecoEventType;
  enderecoId: string;
  centroId: string;
  enderecoMascarado: string;
  userId: number | null;
  motivo?: string;
  metadata?: Record<string, unknown>;
};
