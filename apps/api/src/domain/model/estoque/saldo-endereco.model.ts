import { z } from 'zod';

import { NaturezaSaldoSchema } from './saldo.model.js';

export const StatusSaldoEnderecoSchema = z.enum(['liberado', 'bloqueado']);

export type StatusSaldoEndereco = z.infer<typeof StatusSaldoEnderecoSchema>;

export const MotivoBloqueioSaldoResumoSchema = z.object({
  id: z.uuid(),
  codigo: z.string().min(1).max(50),
  nome: z.string().min(1).max(100),
});

export type MotivoBloqueioSaldoResumo = z.infer<
  typeof MotivoBloqueioSaldoResumoSchema
>;

export const SaldoEnderecoSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string().min(1),
  produtoId: z.string().min(1).max(50),
  depositoId: z.uuid(),
  enderecoId: z.uuid(),
  enderecoMascarado: z.string().optional(),
  lote: z.string(),
  validade: z.coerce.date().nullable(),
  numeroSerie: z.string(),
  natureza: NaturezaSaldoSchema,
  status: StatusSaldoEnderecoSchema,
  motivoBloqueio: MotivoBloqueioSaldoResumoSchema.nullable(),
  observacaoBloqueio: z.string().nullable(),
  bloqueadoEm: z.coerce.date().nullable(),
  bloqueadoPor: z.number().int().nullable(),
  quantidade: z.number(),
  unidadeMedida: z.string().min(1),
  updatedAt: z.coerce.date(),
});

export type SaldoEndereco = z.infer<typeof SaldoEnderecoSchema>;
