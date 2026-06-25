import { z } from 'zod';

export const CncOrigemSchema = z.enum(['recebimento']);
export type CncOrigem = z.infer<typeof CncOrigemSchema>;

export const CncResponsavelSchema = z.enum([
  'transportadora',
  'fornecedor',
  'operacao',
  'indeterminado',
]);
export type CncResponsavel = z.infer<typeof CncResponsavelSchema>;

export const CncSituacaoSchema = z.enum([
  'pendente',
  'em_analise',
  'aprovado',
  'rejeitado',
  'encerrado',
]);
export type CncSituacao = z.infer<typeof CncSituacaoSchema>;

export const CncItemTipoSchema = z.enum(['divergencia', 'avaria']);
export type CncItemTipo = z.infer<typeof CncItemTipoSchema>;
