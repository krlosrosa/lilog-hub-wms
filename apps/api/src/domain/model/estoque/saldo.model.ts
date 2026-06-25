import { z } from 'zod';

import { NaturezaSaldoSchema } from './movimentacao-estoque.model.js';

export const SaldoSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string().min(1),
  produtoId: z.uuid(),
  depositoId: z.uuid(),
  depositoCodigo: z.string().optional(),
  depositoNome: z.string().optional(),
  lote: z.string(),
  validade: z.coerce.date().nullable(),
  numeroSerie: z.string(),
  natureza: NaturezaSaldoSchema,
  quantidade: z.number(),
  unidadeMedida: z.string().min(1),
  documentoRef: z.string().optional(),
  updatedAt: z.coerce.date(),
});

export type Saldo = z.infer<typeof SaldoSchema>;
