import { z } from 'zod';

export const RegraEnderecamentoCriterioTipoSchema = z.enum([
  'grupo',
  'categoria',
  'produto',
]);

export type RegraEnderecamentoCriterioTipo = z.infer<
  typeof RegraEnderecamentoCriterioTipoSchema
>;

export const RegraEnderecamentoDestinoTipoSchema = z.enum([
  'zona',
  'endereco',
]);

export type RegraEnderecamentoDestinoTipo = z.infer<
  typeof RegraEnderecamentoDestinoTipoSchema
>;

function emptyStringToUndefined(value: unknown) {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
}

export const RegraEnderecamentoDestinoInputSchema = z
  .object({
    prioridade: z.number().int().min(1),
    tipo: RegraEnderecamentoDestinoTipoSchema,
    zona: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).max(100).optional(),
    ),
    rua: z.preprocess(
      emptyStringToUndefined,
      z.string().min(1).max(10).optional(),
    ),
    enderecoId: z.preprocess(emptyStringToUndefined, z.uuid().optional()),
    ativo: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.tipo === 'zona' && !value.zona?.trim() && !value.rua?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe a zona ou o corredor',
        path: ['zona'],
      });
    }

    if (value.tipo === 'endereco' && !value.enderecoId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Endereço é obrigatório quando o tipo é endereco',
        path: ['enderecoId'],
      });
    }
  });

export type RegraEnderecamentoDestinoInput = z.infer<
  typeof RegraEnderecamentoDestinoInputSchema
>;

export const CreateRegraEnderecamentoInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  nome: z.string().min(1).max(100),
  criterioTipo: RegraEnderecamentoCriterioTipoSchema,
  criterioValor: z.string().min(1).max(100),
  prioridade: z.number().int().min(1).default(10),
  ativo: z.boolean().default(true),
  destinos: z.array(RegraEnderecamentoDestinoInputSchema).min(1),
});

export type CreateRegraEnderecamentoInput = z.infer<
  typeof CreateRegraEnderecamentoInputSchema
>;

export const UpdateRegraEnderecamentoInputSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  criterioTipo: RegraEnderecamentoCriterioTipoSchema.optional(),
  criterioValor: z.string().min(1).max(100).optional(),
  prioridade: z.number().int().min(1).optional(),
  ativo: z.boolean().optional(),
  destinos: z.array(RegraEnderecamentoDestinoInputSchema).min(1).optional(),
});

export type UpdateRegraEnderecamentoInput = z.infer<
  typeof UpdateRegraEnderecamentoInputSchema
>;

export const RegraEnderecamentoDestinoSchema = z.object({
  id: z.uuid(),
  regraId: z.uuid(),
  prioridade: z.number().int(),
  tipo: RegraEnderecamentoDestinoTipoSchema,
  zona: z.string().nullable(),
  rua: z.string().nullable(),
  enderecoId: z.uuid().nullable(),
  enderecoLabel: z.string().nullable().optional(),
  ativo: z.boolean(),
});

export type RegraEnderecamentoDestino = z.infer<
  typeof RegraEnderecamentoDestinoSchema
>;

export const RegraEnderecamentoSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  nome: z.string(),
  criterioTipo: RegraEnderecamentoCriterioTipoSchema,
  criterioValor: z.string(),
  prioridade: z.number().int(),
  ativo: z.boolean(),
  destinos: z.array(RegraEnderecamentoDestinoSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type RegraEnderecamento = z.infer<typeof RegraEnderecamentoSchema>;
