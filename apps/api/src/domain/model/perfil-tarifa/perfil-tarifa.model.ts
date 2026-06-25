import { z } from 'zod';

export const TipoCargaSchema = z.enum(['seco', 'refrigerado']);

export type TipoCarga = z.infer<typeof TipoCargaSchema>;

export const FaixaKmInputSchema = z.object({
  kmInicial: z.coerce.number().nonnegative(),
  kmFinal: z.coerce.number().positive().nullable().optional(),
  valor: z.coerce.number().positive(),
  itinerario: z.string().nullable().optional(),
});

export type FaixaKmInput = z.infer<typeof FaixaKmInputSchema>;

export const CreatePerfilTarifaInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  idRavex: z.number().int().positive(),
  nome: z.string().min(1).max(255),
  descricao: z.string().max(500).nullable().optional(),
  peso: z.coerce.number().positive(),
  cubagem: z.coerce.number().positive().nullable().optional(),
  tipoCarga: TipoCargaSchema,
});

export type CreatePerfilTarifaInput = z.infer<
  typeof CreatePerfilTarifaInputSchema
>;

export const UpdatePerfilTarifaInputSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().max(500).nullable().optional(),
  peso: z.coerce.number().positive().optional(),
  cubagem: z.coerce.number().positive().nullable().optional(),
  tipoCarga: TipoCargaSchema.optional(),
});

export type UpdatePerfilTarifaInput = z.infer<
  typeof UpdatePerfilTarifaInputSchema
>;

export const UpsertFaixasKmInputSchema = z.object({
  faixas: z.array(FaixaKmInputSchema).min(1),
});

export type UpsertFaixasKmInput = z.infer<typeof UpsertFaixasKmInputSchema>;
