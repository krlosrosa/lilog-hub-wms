import { z } from 'zod';

export const ClusterSchema = z.enum(['Cross', 'CD-Fabrica', 'Distribuicao']);
export type Cluster = z.infer<typeof ClusterSchema>;

export const EmpresaSchema = z.enum(['LDB', 'ITB', 'DPA']);
export type Empresa = z.infer<typeof EmpresaSchema>;

export const CentroSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string().min(1).max(50),
  centro: z
    .string()
    .length(4)
    .regex(/^\d{4}$/, 'Centro deve conter exatamente 4 dígitos'),
  empresa: EmpresaSchema,
  nome: z.string().min(1),
  createdAt: z.coerce.date(),
});

export type Centro = z.infer<typeof CentroSchema>;

export const UnidadeSchema = z.object({
  id: z.string().min(1).max(50),
  nome: z.string().min(1),
  cluster: ClusterSchema,
  nomeFilial: z.string().min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Unidade = z.infer<typeof UnidadeSchema>;

export const CreateCentroInputSchema = CentroSchema.omit({
  id: true,
  unidadeId: true,
  createdAt: true,
});

export type CreateCentroInput = z.infer<typeof CreateCentroInputSchema>;

export const UpdateCentroInputSchema = CreateCentroInputSchema.partial();
export type UpdateCentroInput = z.infer<typeof UpdateCentroInputSchema>;

export const CreateUnidadeInputSchema = UnidadeSchema.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  centros: z.array(CreateCentroInputSchema).default([]),
});

export type CreateUnidadeInput = z.infer<typeof CreateUnidadeInputSchema>;

export const UpdateUnidadeInputSchema = UnidadeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type UpdateUnidadeInput = z.infer<typeof UpdateUnidadeInputSchema>;
