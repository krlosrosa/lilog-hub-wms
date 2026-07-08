import { z } from 'zod';

export const ReservaStatusSchema = z.enum([
  'ativa',
  'parcial',
  'atendida',
  'cancelada',
  'expirada',
]);

export type ReservaStatus = z.infer<typeof ReservaStatusSchema>;

export const ReservaOrigemSchema = z.enum([
  'pedido',
  'separacao',
  'manual',
  'inventario',
]);

export type ReservaOrigem = z.infer<typeof ReservaOrigemSchema>;

export const ReservaEstoqueSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string().min(1),
  produtoId: z.string().min(1).max(50),
  depositoId: z.uuid(),
  enderecoId: z.uuid().nullable(),
  lote: z.string().nullable(),
  numeroSerie: z.string().nullable(),
  quantidade: z.number(),
  quantidadeAtendida: z.number(),
  status: ReservaStatusSchema,
  origem: ReservaOrigemSchema,
  documentoRef: z.string().min(1),
  motivo: z.string().nullable(),
  operatorId: z.number().int().nullable(),
  expiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ReservaEstoque = z.infer<typeof ReservaEstoqueSchema>;

export const CriarReservaInputSchema = z.object({
  unidadeId: z.string().min(1),
  produtoId: z.string().min(1).max(50),
  depositoId: z.uuid(),
  enderecoId: z.uuid().optional(),
  lote: z.string().optional(),
  numeroSerie: z.string().optional(),
  quantidade: z.number().positive(),
  origem: ReservaOrigemSchema,
  documentoRef: z.string().min(1),
  motivo: z.string().optional(),
  operatorId: z.number().int().nullable().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type CriarReservaInput = z.infer<typeof CriarReservaInputSchema>;

export const LiberarReservaInputSchema = z.object({
  reservaId: z.uuid(),
  motivo: z.string().optional(),
  operatorId: z.number().int().nullable().optional(),
});

export type LiberarReservaInput = z.infer<typeof LiberarReservaInputSchema>;

export const ConsumirReservaInputSchema = z.object({
  reservaId: z.uuid(),
  quantidade: z.number().positive(),
  operatorId: z.number().int().nullable().optional(),
});

export type ConsumirReservaInput = z.infer<typeof ConsumirReservaInputSchema>;
