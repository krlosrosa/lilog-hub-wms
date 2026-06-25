import { z } from 'zod';

export const CorteStatusSchema = z.enum([
  'solicitado',
  'em_andamento',
  'concluido',
  'cancelado',
]);

export type CorteStatus = z.infer<typeof CorteStatusSchema>;

export const CorteItemInputSchema = z.object({
  mapaGrupoItemId: z.uuid(),
  quantidadeCorte: z.number().positive(),
});

export type CorteItemInput = z.infer<typeof CorteItemInputSchema>;

export const SolicitarCorteInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  mapaGrupoId: z.uuid(),
  mapaGrupoMicroUuid: z.string().min(1).max(120),
  doca: z.string().max(50).optional(),
  motivo: z.string().max(2000).optional(),
  observacao: z.string().max(2000).optional(),
  itens: z.array(CorteItemInputSchema).min(1),
  solicitadoPor: z.number().int().positive(),
});

export type SolicitarCorteInput = z.infer<typeof SolicitarCorteInputSchema>;

export const CancelarCorteInputSchema = z.object({
  corteId: z.uuid(),
  unidadeId: z.string().min(1).max(50),
  canceladoPor: z.number().int().positive(),
  motivoCancelamento: z.string().min(1).max(2000),
});

export type CancelarCorteInput = z.infer<typeof CancelarCorteInputSchema>;

export const TransicaoCorteInputSchema = z.object({
  corteId: z.uuid(),
  unidadeId: z.string().min(1).max(50),
  userId: z.number().int().positive(),
});

export type TransicaoCorteInput = z.infer<typeof TransicaoCorteInputSchema>;

export const ListCortesInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: CorteStatusSchema.optional(),
  search: z.string().max(120).optional(),
});

export type ListCortesInput = z.infer<typeof ListCortesInputSchema>;
