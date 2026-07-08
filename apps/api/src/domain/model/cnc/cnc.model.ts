import { z } from 'zod';

export const CncOrigemSchema = z.enum(['recebimento']);
export type CncOrigem = z.infer<typeof CncOrigemSchema>;

export const CncResponsavelSchema = z.enum([
  'transportadora',
  'fornecedor',
  'fabrica',
  'operacao',
  'indeterminado',
]);
export type CncResponsavel = z.infer<typeof CncResponsavelSchema>;

export const CncSituacaoSchema = z.enum([
  'pendente',
  'em_analise',
  'encerrada',
  'cancelada',
]);
export type CncSituacao = z.infer<typeof CncSituacaoSchema>;

export const CncItemTipoSchema = z.enum(['divergencia', 'avaria']);
export type CncItemTipo = z.infer<typeof CncItemTipoSchema>;

export const CncSubtipoOcorrenciaSchema = z.enum([
  'falta',
  'sobra',
  'avaria',
  'lote_divergente',
  'peso_divergente',
  'validade_divergente',
  'produto_nao_previsto',
]);
export type CncSubtipoOcorrencia = z.infer<typeof CncSubtipoOcorrenciaSchema>;

export const CncTratativaTipoSchema = z.enum([
  'imediata',
  'corretiva',
  'preventiva',
]);
export type CncTratativaTipo = z.infer<typeof CncTratativaTipoSchema>;

export const CncTratativaStatusSchema = z.enum([
  'pendente',
  'concluida',
  'cancelada',
]);
export type CncTratativaStatus = z.infer<typeof CncTratativaStatusSchema>;

export const CNC_EVENTO = {
  CNC_CRIADA: 'CNC_CRIADA',
  ANALISE_INICIADA: 'ANALISE_INICIADA',
  ENCERRADA: 'ENCERRADA',
  CANCELADA: 'CANCELADA',
  TRATATIVA_ADICIONADA: 'TRATATIVA_ADICIONADA',
  TRATATIVA_CONCLUIDA: 'TRATATIVA_CONCLUIDA',
} as const;

export type CncEventoTipo =
  (typeof CNC_EVENTO)[keyof typeof CNC_EVENTO];
