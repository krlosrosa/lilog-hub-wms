import { z } from 'zod';

export const EnderecoDivergenteSchema = z.enum([
  'bloquear',
  'permitir_com_motivo',
  'permitir_com_aprovacao',
]);
export type EnderecoDivergente = z.infer<typeof EnderecoDivergenteSchema>;

export const QuantidadeParcialSchema = z.enum([
  'bloquear',
  'permitir_com_motivo',
  'permitir_livre',
]);
export type QuantidadeParcial = z.infer<typeof QuantidadeParcialSchema>;

export const PoliticaArmazenagemSchema = z.object({
  enderecoDivergente: EnderecoDivergenteSchema.default('bloquear'),
  quantidadeParcial: QuantidadeParcialSchema.default('permitir_com_motivo'),
  exigirBipagemProduto: z.boolean().default(true),
  exigirBipagemEndereco: z.boolean().default(true),
  permitirOffline: z.boolean().default(true),
  concluirAutomaticamenteDemanda: z.boolean().default(false),
});
export type PoliticaArmazenagem = z.infer<typeof PoliticaArmazenagemSchema>;

export const DEFAULT_POLITICA_ARMAZENAGEM: PoliticaArmazenagem = {
  enderecoDivergente: 'bloquear',
  quantidadeParcial: 'permitir_com_motivo',
  exigirBipagemProduto: true,
  exigirBipagemEndereco: true,
  permitirOffline: true,
  concluirAutomaticamenteDemanda: false,
};
