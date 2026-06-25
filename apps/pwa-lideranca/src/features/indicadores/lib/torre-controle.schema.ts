import { z } from 'zod';

export const etapaOperacionalSchema = z.enum([
  'separacao',
  'conferencia',
  'carregamento',
  'finalizado',
]);

export type EtapaOperacional = z.infer<typeof etapaOperacionalSchema>;

export const ETAPA_OPERACIONAL_LABELS: Record<EtapaOperacional, string> = {
  separacao: 'Separação',
  conferencia: 'Conferência',
  carregamento: 'Carregamento',
  finalizado: 'Finalizado',
};

export const processoStatusSchema = z.enum([
  'pendente',
  'em_andamento',
  'concluido',
]);

export type ProcessoStatus = z.infer<typeof processoStatusSchema>;

export const PROCESSO_STATUS_LABELS: Record<ProcessoStatus, string> = {
  pendente: 'Não iniciado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
};

export const statusProcessosSchema = z.object({
  separacao: processoStatusSchema,
  conferencia: processoStatusSchema,
  carregamento: processoStatusSchema,
});

export type StatusProcessos = z.infer<typeof statusProcessosSchema>;

export const horarioProcessoSchema = z.object({
  inicio: z.string().nullable(),
  fim: z.string().nullable(),
});

export type HorarioProcesso = z.infer<typeof horarioProcessoSchema>;

export const horariosProcessosSchema = z.object({
  separacao: horarioProcessoSchema,
  conferencia: horarioProcessoSchema,
  carregamento: horarioProcessoSchema,
});

export type HorariosProcessos = z.infer<typeof horariosProcessosSchema>;

export const nivelRiscoSchema = z.enum(['critico', 'alto', 'medio', 'baixo']);

export type NivelRisco = z.infer<typeof nivelRiscoSchema>;

export const NIVEL_RISCO_LABELS: Record<NivelRisco, string> = {
  critico: 'Crítico',
  alto: 'Alto',
  medio: 'Médio',
  baixo: 'Baixo',
};

export const alertSeveritySchema = z.enum(['error', 'warning', 'info']);

export type AlertSeverity = z.infer<typeof alertSeveritySchema>;

export const alertaTipoSchema = z.enum([
  'prioridade_nao_iniciada',
  'prioridade_atrasada',
  'atraso_iminente',
  'fila_conferencia',
  'baixa_produtividade',
  'recursos_insuficientes',
]);

export type AlertaTipo = z.infer<typeof alertaTipoSchema>;

export const nivelPrioridadeTorreSchema = z.enum([
  'urgente',
  'prioritaria',
  'normal',
  'baixa',
]);

export type NivelPrioridadeTorre = z.infer<typeof nivelPrioridadeTorreSchema>;

export const NIVEL_PRIORIDADE_LABELS: Record<NivelPrioridadeTorre, string> = {
  urgente: 'Urgente',
  prioritaria: 'Prioritária',
  normal: 'Normal',
  baixa: 'Baixa',
};

export const filtroRapidoTorreSchema = z.enum([
  'todos',
  'prioritarios',
  'atrasados',
  'criticos',
  'prioritarios_atrasados',
]);

export type FiltroRapidoTorre = z.infer<typeof filtroRapidoTorreSchema>;

export const FILTRO_RAPIDO_TORRE_LABELS: Record<FiltroRapidoTorre, string> = {
  todos: 'Todos',
  prioritarios: 'Prioritários',
  atrasados: 'Atrasados',
  criticos: 'Críticos',
  prioritarios_atrasados: 'Prior. atrasados',
};

export const transporteRiscoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  placa: z.string(),
  transportadora: z.string(),
  prioridade: z.boolean(),
  isPrioridade: z.boolean(),
  nivelPrioridade: nivelPrioridadeTorreSchema.nullable(),
  reentregaExclusiva: z.boolean(),
  etapaAtual: etapaOperacionalSchema,
  horarioSaida: z.string(),
  tempoRestanteSaidaMin: z.number(),
  tempoEstimadoFinalizarMin: z.number(),
  nivelRisco: nivelRiscoSchema,
  scoreCriticidade: z.number(),
  mapasTotal: z.number().int().nonnegative(),
  mapasConcluidos: z.number().int().nonnegative(),
  volumePaletes: z.number().int().nonnegative(),
  statusProcessos: statusProcessosSchema,
  horariosProcessos: horariosProcessosSchema,
  docaAlocada: z.string().optional(),
});

export type TransporteRisco = z.infer<typeof transporteRiscoSchema>;

export const mapaResumoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  transporteCodigo: z.string(),
  etapa: etapaOperacionalSchema,
  tempoParadoMin: z.number(),
  operador: z.string().optional(),
  prioridade: z.boolean(),
});

export type MapaResumo = z.infer<typeof mapaResumoSchema>;

export const etapaPipelineSchema = z.object({
  etapa: etapaOperacionalSchema,
  label: z.string(),
  qtdMapas: z.number().int().nonnegative(),
  tempoMedioParadoMin: z.number(),
  volumeAcumuladoPaletes: z.number().int().nonnegative(),
  capacidadeHora: z.number(),
  isGargalo: z.boolean(),
  saturacaoPercent: z.number().min(0).max(100),
});

export type EtapaPipeline = z.infer<typeof etapaPipelineSchema>;

export const alertaOperacionalSchema = z.object({
  id: z.string(),
  tipo: alertaTipoSchema,
  severity: alertSeveritySchema,
  title: z.string(),
  description: z.string(),
  timeAgo: z.string(),
  entityId: z.string().optional(),
  sectionId: z.string().optional(),
});

export type AlertaOperacional = z.infer<typeof alertaOperacionalSchema>;

export const torreControleKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  suffix: z.string().optional(),
  footer: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  accent: z.enum(['primary', 'muted', 'destructive', 'tertiary', 'warning']),
});

export type TorreControleKpi = z.infer<typeof torreControleKpiSchema>;

export const turnoStatusSchema = z.object({
  sessaoId: z.string(),
  turnoLabel: z.string(),
  inicio: z.string(),
  fim: z.string(),
  progressoPercent: z.number().min(0).max(100),
  previsaoConclusao: z.string(),
  transportesEmRisco: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
});

export type TurnoStatus = z.infer<typeof turnoStatusSchema>;

export const torreControleSnapshotSchema = z.object({
  kpis: z.array(torreControleKpiSchema),
  pipeline: z.array(etapaPipelineSchema),
  recursos: z.array(z.unknown()),
  timeline: z.array(z.unknown()),
  docas: z.array(z.unknown()),
  transportes: z.array(transporteRiscoSchema),
  mapas: z.array(mapaResumoSchema),
  alertas: z.array(alertaOperacionalSchema),
  turno: turnoStatusSchema,
});

export type TorreControleSnapshot = z.infer<typeof torreControleSnapshotSchema>;
