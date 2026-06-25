import { z } from 'zod';

export const kpiAccentSchema = z.enum([
  'primary',
  'tertiary',
  'warning',
  'destructive',
  'muted',
]);

export type KpiAccent = z.infer<typeof kpiAccentSchema>;

export const kpiDashboardSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  suffix: z.string().optional(),
  accent: kpiAccentSchema,
  progress: z.number().min(0).max(100).optional(),
  footer: z.string().optional(),
});

export type KpiDashboard = z.infer<typeof kpiDashboardSchema>;

export const etapaPipelineSchema = z.object({
  id: z.string(),
  label: z.string(),
  count: z.number(),
  percentual: z.number(),
  cor: z.string(),
});

export type EtapaPipeline = z.infer<typeof etapaPipelineSchema>;

export const rotaStatusSchema = z.enum([
  'em_viagem',
  'entregue',
  'parcial',
  'atrasado',
  'aguardando',
]);

export type RotaStatus = z.infer<typeof rotaStatusSchema>;

export const ROTA_STATUS_LABELS: Record<RotaStatus, string> = {
  em_viagem: 'Em viagem',
  entregue: 'Entregue',
  parcial: 'Parcial',
  atrasado: 'Atrasado',
  aguardando: 'Aguardando',
};

export const rotaDashboardSchema = z.object({
  id: z.string(),
  rota: z.string(),
  veiculo: z.string(),
  placa: z.string(),
  totalNfs: z.number(),
  entregues: z.number(),
  devolucoes: z.number(),
  entregasPrioritarias: z.number(),
  entregasPrioritariasEntregues: z.number(),
  status: rotaStatusSchema,
  previsaoRetorno: z.string(),
});

export type RotaDashboard = z.infer<typeof rotaDashboardSchema>;

export const motivoDevolucaoSchema = z.enum([
  'ausente',
  'recusa',
  'endereco',
  'avaria',
  'outro',
]);

export type MotivoDevolucao = z.infer<typeof motivoDevolucaoSchema>;

export const MOTIVO_DEVOLUCAO_LABELS: Record<MotivoDevolucao, string> = {
  ausente: 'Cliente ausente',
  recusa: 'Recusa',
  endereco: 'Endereço incorreto',
  avaria: 'Avaria',
  outro: 'Outro',
};

export const devolucaoRecenteSchema = z.object({
  id: z.string(),
  nf: z.string(),
  cliente: z.string(),
  motivo: motivoDevolucaoSchema,
  rota: z.string(),
  hora: z.string(),
});

export type DevolucaoRecente = z.infer<typeof devolucaoRecenteSchema>;

export const pontoHorarioSchema = z.object({
  hora: z.string(),
  valor: z.number(),
});

export type PontoHorario = z.infer<typeof pontoHorarioSchema>;

export const rankingOcupacaoRotaSchema = z.object({
  rota: z.string(),
  ocupacao: z.number(),
  dropsize: z.number().optional(),
});

export type RankingOcupacaoRota = z.infer<typeof rankingOcupacaoRotaSchema>;

export const rankingDropsizeRotaSchema = z.object({
  rota: z.string(),
  dropsize: z.number(),
  remessas: z.number().optional(),
});

export type RankingDropsizeRota = z.infer<typeof rankingDropsizeRotaSchema>;

export const transporteIndicadoresSchema = z.object({
  dropsizeMedio: z.number(),
  ocupacaoMedia: z.number(),
  rankingOcupacaoPorRota: z.array(rankingOcupacaoRotaSchema),
  rankingDropsizePorRota: z.array(rankingDropsizeRotaSchema),
});

export type TransporteIndicadores = z.infer<typeof transporteIndicadoresSchema>;

export const produtividadeSetorSchema = z.object({
  id: z.string(),
  label: z.string(),
  produtividadeHora: z.number(),
  metaProdutividadeHora: z.number(),
  saturacaoPercent: z.number(),
});

export type ProdutividadeSetor = z.infer<typeof produtividadeSetorSchema>;

export const produtividadeOperacionalSchema = z.object({
  produtividadeHora: z.number(),
  metaProdutividadeHora: z.number(),
  unidade: z.string(),
  setores: z.array(produtividadeSetorSchema),
});

export type ProdutividadeOperacional = z.infer<
  typeof produtividadeOperacionalSchema
>;

export const dashboardOperacionalSnapshotSchema = z.object({
  dataReferencia: z.string(),
  turnoLabel: z.string(),
  kpis: z.array(kpiDashboardSchema),
  pipeline: z.array(etapaPipelineSchema),
  rotas: z.array(rotaDashboardSchema),
  devolucoesRecentes: z.array(devolucaoRecenteSchema),
  entregasPorHora: z.array(pontoHorarioSchema),
  transporte: transporteIndicadoresSchema,
  produtividade: produtividadeOperacionalSchema,
});

export type DashboardOperacionalSnapshot = z.infer<
  typeof dashboardOperacionalSnapshotSchema
>;
