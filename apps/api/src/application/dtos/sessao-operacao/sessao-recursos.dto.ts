import { z } from 'zod';

export const AlertaPausaDtoSchema = z.object({
  precisaPausa: z.boolean(),
  tipo: z.enum(['termica', 'refeicao', 'outros']).optional(),
  minutosRestantes: z.number().int().optional(),
  minutosExcedidos: z.number().int().optional(),
});

export const ProximaPausaDtoSchema = AlertaPausaDtoSchema.extend({
  horarioPrevisto: z.iso.datetime().optional(),
});

export const RecursosSessaoKpiDtoSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  suffix: z.string().optional(),
  footer: z.string().optional(),
  progress: z.number().int().optional(),
  accent: z
    .enum(['primary', 'tertiary', 'warning', 'destructive', 'muted'])
    .optional(),
});
