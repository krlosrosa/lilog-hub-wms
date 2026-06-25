import { z } from 'zod';

import { RavexApiEnvelopeSchema } from './ravex.types.js';

export const RavexViagemFaturadaSchema = z.object({
  id: z.number(),
  identificador: z.string().nullable().optional(),
  inicioDataHora: z.string().nullable().optional(),
  fimDataHora: z.string().nullable().optional(),
});

export type RavexViagemFaturada = z.infer<typeof RavexViagemFaturadaSchema>;

export const RavexViagemFaturadaEnvelopeSchema = RavexApiEnvelopeSchema(
  RavexViagemFaturadaSchema,
);

export const RavexAnomaliaMotivoSchema = z.object({
  id: z.number().optional(),
  descricao: z.string().nullable().optional(),
  codigo: z.string().nullable().optional(),
});

export const RavexAnomaliaViagemSchema = z.object({
  anomaliaId: z.number(),
  motivo: RavexAnomaliaMotivoSchema.nullable().optional(),
});

export type RavexAnomaliaViagem = z.infer<typeof RavexAnomaliaViagemSchema>;

export const RavexAnomaliaViagemListEnvelopeSchema = RavexApiEnvelopeSchema(
  z.array(RavexAnomaliaViagemSchema),
);
