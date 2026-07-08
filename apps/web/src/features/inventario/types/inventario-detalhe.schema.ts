import { z } from 'zod';

export const divergenciaStatusSchema = z.enum([
  'pendente',
  'aprovada',
  'reprovada',
  'aplicada',
]);

export type DivergenciaStatus = z.infer<typeof divergenciaStatusSchema>;

export const divergenciaTipoSchema = z.enum([
  'falta',
  'sobra',
  'endereco_vazio',
  'anomalia',
]);

export type DivergenciaTipo = z.infer<typeof divergenciaTipoSchema>;

export const demandaProgressoStatusSchema = z.enum([
  'aguardando_inicio',
  'em_andamento',
  'concluida',
  'cancelada',
]);

export type DemandaProgressoStatus = z.infer<typeof demandaProgressoStatusSchema>;

export const recontagemAtualSchema = z.object({
  id: z.string(),
  demandaId: z.string(),
  demandaStatus: demandaProgressoStatusSchema,
  responsavelId: z.number().int(),
  responsavelNome: z.string(),
  solicitadaPor: z.number().int().nullable(),
  solicitadaEm: z.string(),
  motivo: z.string(),
});

export type RecontagemAtual = z.infer<typeof recontagemAtualSchema>;

export const divergenciaItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  produtoNome: z.string(),
  setor: z.string(),
  endereco: z.string().optional(),
  esperadoLabel: z.string(),
  encontradoLabel: z.string(),
  diferencaLabel: z.string(),
  tipo: divergenciaTipoSchema,
  status: divergenciaStatusSchema.optional(),
  podeAprovar: z.boolean().optional(),
  podeRecontar: z.boolean().optional(),
  recontagemAtual: recontagemAtualSchema.nullable().optional(),
});

export type DivergenciaItem = z.infer<typeof divergenciaItemSchema>;

export type DivergenciaFiltroStatus = 'todas' | DivergenciaStatus;

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
  endereco_vazio: 'End. vazio',
  anomalia: 'Anomalia',
};

export const DIVERGENCIA_STATUS_LABELS: Record<DivergenciaStatus, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  reprovada: 'Reprovada',
  aplicada: 'Aplicada',
};

export const demandaProgressoItemSchema = z.object({
  id: z.string(),
  nome: z.string(),
  tipo: z.enum(['cega', 'validacao']),
  prioridade: z.enum(['baixa', 'media', 'alta', 'critica']),
  status: demandaProgressoStatusSchema,
  responsavelNome: z.string(),
  totalEnderecos: z.number().int().nonnegative(),
  enderecosConferidos: z.number().int().nonnegative(),
  progressPercent: z.number().min(0).max(100),
  ativo: z.boolean(),
});

export type DemandaProgressoItem = z.infer<typeof demandaProgressoItemSchema>;

export const DEMANDA_PROGRESSO_STATUS_LABELS: Record<
  DemandaProgressoStatus,
  string
> = {
  aguardando_inicio: 'Aguardando',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const RECONTAGEM_DEMANDA_STATUS_LABELS = DEMANDA_PROGRESSO_STATUS_LABELS;
