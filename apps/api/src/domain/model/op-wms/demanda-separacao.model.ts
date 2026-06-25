import { z } from 'zod';

export const DemandaSeparacaoStatusSchema = z.enum([
  'pendente',
  'em_andamento',
  'concluida',
  'cancelada',
]);

export type DemandaSeparacaoStatus = z.infer<typeof DemandaSeparacaoStatusSchema>;

export const DemandaSeparacaoSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  sessaoId: z.uuid(),
  mapaGrupoId: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
  status: DemandaSeparacaoStatusSchema,
  atribuidoPor: z.number().int().nullable(),
  atribuidoEm: z.coerce.date(),
  iniciadoEm: z.coerce.date().nullable(),
  finalizadoEm: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type DemandaSeparacao = z.infer<typeof DemandaSeparacaoSchema>;

export const CriarDemandasSeparacaoInputSchema = z.object({
  sessaoId: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
  mapaGrupoIds: z.array(z.uuid()).min(1),
  atribuidoPor: z.number().int().positive(),
});

export type CriarDemandasSeparacaoInput = z.infer<
  typeof CriarDemandasSeparacaoInputSchema
>;
