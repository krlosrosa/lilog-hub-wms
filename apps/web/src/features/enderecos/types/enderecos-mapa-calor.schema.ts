import { z } from 'zod';

export const mapaCalorTabSchema = z.enum([
  'ocupacao',
  'giro',
  'risco-validade',
]);

export type MapaCalorTab = z.infer<typeof mapaCalorTabSchema>;

export const heatCellNivelSchema = z.enum([
  'livre',
  'parcial',
  'alto',
  'critico',
]);

export type HeatCellNivel = z.infer<typeof heatCellNivelSchema>;

export const heatCellSchema = z.object({
  id: z.string(),
  label: z.string(),
  rua: z.string(),
  nivel: heatCellNivelSchema,
  ocupacaoPercent: z.number().min(0).max(100),
});

export type HeatCell = z.infer<typeof heatCellSchema>;

export const ruaMetricasSchema = z.object({
  rua: z.string(),
  taxaOcupacaoPercent: z.number().min(0).max(100),
  giroPercent: z.number().min(0).max(100),
  giroLabel: z.string(),
  totalPallets: z.number().int().nonnegative(),
  pickingsPorDia: z.number().int().nonnegative(),
});

export type RuaMetricas = z.infer<typeof ruaMetricasSchema>;

export const alertaTipoSchema = z.enum([
  'vencimento',
  'gargalo',
  'ocupacao',
]);

export type AlertaTipo = z.infer<typeof alertaTipoSchema>;

export const alertaCriticoSchema = z.object({
  id: z.string(),
  tipo: alertaTipoSchema,
  titulo: z.string(),
  descricao: z.string(),
  detalhe: z.string(),
});

export type AlertaCritico = z.infer<typeof alertaCriticoSchema>;

export const MAPA_CALOR_TAB_LABELS: Record<MapaCalorTab, string> = {
  ocupacao: 'Ocupação',
  giro: 'Giro (SKUs)',
  'risco-validade': 'Risco de Validade',
};
