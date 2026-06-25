import { z } from 'zod';

import { RavexApiEnvelopeSchema } from './ravex.types.js';

export const RavexTipoVeiculoSchema = z.object({
  id: z.number(),
  nome: z.string().nullable().optional(),
  peso: z.number().nullable().optional(),
  cubagem: z.number().nullable().optional(),
  tara: z.number().nullable().optional(),
});

export type RavexTipoVeiculo = z.infer<typeof RavexTipoVeiculoSchema>;

export const RavexTipoVeiculoListEnvelopeSchema = RavexApiEnvelopeSchema(
  z.array(RavexTipoVeiculoSchema),
);

export const RavexTransportadoraEmbeddedSchema = z.object({
  id: z.number(),
  nome: z.string().min(1),
  cnpj: z.string().min(1),
});

export const RavexVeiculoSchema = z.object({
  id: z.number(),
  placa: z.string(),
  tipoVeiculo: RavexTipoVeiculoSchema.nullable().optional(),
  transportadora: RavexTransportadoraEmbeddedSchema,
  estrangeiro: z.boolean().optional().default(false),
});

export type RavexVeiculo = z.infer<typeof RavexVeiculoSchema>;

export const RavexVeiculoListEnvelopeSchema = RavexApiEnvelopeSchema(
  z.array(RavexVeiculoSchema),
);

export const RavexVeiculoSingleEnvelopeSchema = RavexApiEnvelopeSchema(
  RavexVeiculoSchema,
);

export const RavexTransportadoraEntidadeSchema = z.object({
  id: z.number(),
  nome: z.string().min(1),
  cnpj: z.string().min(1),
});

export const RavexTransportadoraEntidadeEnvelopeSchema = RavexApiEnvelopeSchema(
  RavexTransportadoraEntidadeSchema,
);

export type RavexTransportadoraResolvida = {
  id: number;
  nome: string;
  cnpj: string;
  quantidadeVeiculos: number;
};
