import type { CreateCncItemInput } from '../../domain/repositories/cnc/cnc.repository.js';

export const CNC_QUEUE = 'cnc' as const;

export const JOB_CRIAR_CNC = 'criar-cnc' as const;
export const JOB_REGISTRAR_EVENTO_CNC = 'registrar-evento-cnc' as const;

export type CriarCncJobData = {
  recebimentoId: string;
  preRecebimentoId: string;
  unidadeId: string;
  transportadoraId: string;
  responsavelOperacaoId: number;
  userId: number | null;
  descricao: string;
  itens: CreateCncItemInput[];
};

export type RegistrarEventoCncJobData = {
  cncId: string;
  tipoEvento: string;
  situacaoAnterior?: string | null;
  situacaoNova?: string | null;
  descricao?: string | null;
  metadata?: Record<string, unknown>;
  criadoPorUserId?: number | null;
};
