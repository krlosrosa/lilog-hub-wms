import { z } from 'zod';

export const relatorioTabSchema = z.enum(['favoritos', 'todos', 'recentes']);

export type RelatorioTab = z.infer<typeof relatorioTabSchema>;

export const relatorioPeriodoSchema = z.enum([
  'ultimos-7-dias',
  'ultimos-30-dias',
  'mes-atual',
  'personalizado',
]);

export type RelatorioPeriodo = z.infer<typeof relatorioPeriodoSchema>;

export const relatorioUnidadeSchema = z.enum([
  'todas',
  'cd-sp-leste',
  'cd-curitiba',
  'cd-recife',
]);

export type RelatorioUnidade = z.infer<typeof relatorioUnidadeSchema>;

export const relatorioStatusSchema = z.enum([
  'qualquer',
  'concluido',
  'em-processamento',
  'pendente',
]);

export type RelatorioStatus = z.infer<typeof relatorioStatusSchema>;

export const relatorioFiltrosSchema = z.object({
  periodo: relatorioPeriodoSchema,
  unidade: relatorioUnidadeSchema,
  status: relatorioStatusSchema,
});

export type RelatorioFiltros = z.infer<typeof relatorioFiltrosSchema>;

export const relatorioDownloadStatusSchema = z.enum([
  'idle',
  'loading',
  'success',
]);

export type RelatorioDownloadStatus = z.infer<
  typeof relatorioDownloadStatusSchema
>;

export const relatorioVariantSchema = z.enum([
  'primary',
  'secondary',
  'destructive',
]);

export type RelatorioVariant = z.infer<typeof relatorioVariantSchema>;

export const relatorioLayoutSchema = z.enum(['full', 'half']);

export type RelatorioLayout = z.infer<typeof relatorioLayoutSchema>;

export const relatorioItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  badge: z.string().optional(),
  lastUpdated: z.string().optional(),
  recordCount: z.string().optional(),
  alertText: z.string().optional(),
  variant: relatorioVariantSchema,
  layout: relatorioLayoutSchema,
  isFavorite: z.boolean(),
  isRecent: z.boolean(),
});

export type RelatorioItem = z.infer<typeof relatorioItemSchema>;

export const RELATORIO_TAB_LABELS: Record<RelatorioTab, string> = {
  favoritos: 'Favoritos',
  todos: 'Todos',
  recentes: 'Recentes',
};

export const RELATORIO_PERIODOS: readonly RelatorioPeriodo[] = [
  'ultimos-7-dias',
  'ultimos-30-dias',
  'mes-atual',
  'personalizado',
] as const;

export const RELATORIO_PERIODO_LABELS: Record<RelatorioPeriodo, string> = {
  'ultimos-7-dias': 'Últimos 7 dias',
  'ultimos-30-dias': 'Últimos 30 dias',
  'mes-atual': 'Mês atual',
  personalizado: 'Personalizado...',
};

export const RELATORIO_UNIDADES: readonly RelatorioUnidade[] = [
  'todas',
  'cd-sp-leste',
  'cd-curitiba',
  'cd-recife',
] as const;

export const RELATORIO_UNIDADE_LABELS: Record<RelatorioUnidade, string> = {
  todas: 'Todas as Unidades',
  'cd-sp-leste': 'CD São Paulo - Leste',
  'cd-curitiba': 'CD Curitiba',
  'cd-recife': 'CD Recife',
};

export const RELATORIO_STATUS_OPTIONS: readonly RelatorioStatus[] = [
  'qualquer',
  'concluido',
  'em-processamento',
  'pendente',
] as const;

export const RELATORIO_STATUS_LABELS: Record<RelatorioStatus, string> = {
  qualquer: 'Qualquer Status',
  concluido: 'Concluído',
  'em-processamento': 'Em Processamento',
  pendente: 'Pendente',
};

export const DEFAULT_RELATORIO_FILTROS: RelatorioFiltros = {
  periodo: 'ultimos-7-dias',
  unidade: 'todas',
  status: 'qualquer',
};
