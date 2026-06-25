import { z } from 'zod';

export const divergenciaTipoSchema = z.enum(['falta', 'sobra']);

export type DivergenciaTipo = z.infer<typeof divergenciaTipoSchema>;

export const divergenciaItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  produtoNome: z.string(),
  setor: z.string(),
  esperadoLabel: z.string(),
  encontradoLabel: z.string(),
  diferencaLabel: z.string(),
  tipo: divergenciaTipoSchema,
});

export type DivergenciaItem = z.infer<typeof divergenciaItemSchema>;

export const setorProgressoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  iconName: z.enum(['snow', 'grid', 'layers']),
  statusLabel: z.string(),
  statusTone: z.enum(['accent', 'primary', 'muted']),
  progressPercent: z.number().min(0).max(100),
  skuContados: z.number().int().nonnegative(),
  skuTotal: z.number().int().nonnegative(),
  acuraciaLabel: z.string().nullable(),
  opaco: z.boolean().optional(),
});

export type SetorProgresso = z.infer<typeof setorProgressoSchema>;

export const membroProdutividadeSchema = z.object({
  id: z.string(),
  nome: z.string(),
  papel: z.string(),
  itensCount: z.number(),
  segundosPorItem: z.number(),
  avatarUrl: z.string().optional(),
  tone: z.enum(['primary', 'secondary', 'accent']),
});

export type MembroProdutividade = z.infer<typeof membroProdutividadeSchema>;

export const inventarioDetalheHeaderSchema = z.object({
  codigo: z.string(),
  statusLabel: z.string(),
  tempoDecorridoLabel: z.string(),
});

export type InventarioDetalheHeader = z.infer<
  typeof inventarioDetalheHeaderSchema
>;

export const inventarioDetalheMetricasSchema = z.object({
  progressoPercent: z.number(),
  itensContados: z.number(),
  itensTotal: z.number(),
  acuraciaPercent: z.number(),
  metaDeltaLabel: z.string(),
  divergenciasCount: z.number(),
  impactoFinanceiroLabel: z.string(),
});

export type InventarioDetalheMetricas = z.infer<
  typeof inventarioDetalheMetricasSchema
>;

export const DIVERGENCIA_TIPO_LABELS: Record<DivergenciaTipo, string> = {
  falta: 'Falta',
  sobra: 'Sobra',
};
