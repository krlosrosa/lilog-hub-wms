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

export const processoOperacionalSchema = z.enum([
  'separacao',
  'conferencia',
  'carregamento',
]);

export type ProcessoOperacional = z.infer<typeof processoOperacionalSchema>;

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
  prioritarios_atrasados: 'Prioritários atrasados',
};

export const statusTransporteTorreSchema = z.enum([
  'PENDENTE',
  'ALOCADO',
  'PARCIAL',
  'EM_SEPARACAO',
  'SEPARADO',
  'EM_CONFERENCIA',
  'CONFERIDO',
  'EM_CARREGAMENTO',
  'CARREGADO',
  'EM_VIAGEM',
  'VIAGEM_FINALIZADA',
]);

export type StatusTransporteTorre = z.infer<typeof statusTransporteTorreSchema>;

export const transporteRiscoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  placa: z.string(),
  transportadora: z.string(),
  prioridade: z.boolean(),
  isPrioridade: z.boolean(),
  nivelPrioridade: nivelPrioridadeTorreSchema.nullable(),
  reentregaExclusiva: z.boolean(),
  status: statusTransporteTorreSchema,
  etapaAtual: etapaOperacionalSchema,
  horarioSaida: z.string(),
  tempoRestanteSaidaMin: z.number(),
  tempoRestanteSaidaSeg: z.number().int(),
  tempoEstimadoFinalizarMin: z.number(),
  tempoEstimadoFinalizarSeg: z.number().int().nonnegative(),
  nivelRisco: nivelRiscoSchema,
  scoreCriticidade: z.number(),
  mapasTotal: z.number().int().nonnegative(),
  mapasConcluidos: z.number().int().nonnegative(),
  volumePaletes: z.number().int().nonnegative(),
  pesoTotalKg: z.number().nonnegative(),
  statusProcessos: statusProcessosSchema,
  horariosProcessos: horariosProcessosSchema,
  viagemId: z.number().int().nullable().optional(),
  viagemInicioEm: z.string().nullable().optional(),
  viagemFimEm: z.string().nullable().optional(),
  anomalia: z.string().nullable().optional(),
  docaAlocada: z.string().nullable().optional(),
  lacreCarregamento: z.string().nullable().optional(),
});

export type TransporteRisco = z.infer<typeof transporteRiscoSchema>;

export const mapaResumoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  transporteId: z.string(),
  transporteCodigo: z.string(),
  etapa: etapaOperacionalSchema,
  status: processoStatusSchema,
  horarioInicio: z.string().nullable(),
  horarioFim: z.string().nullable(),
  tempoParadoMin: z.number(),
  tempoParadoSeg: z.number().int().nonnegative(),
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

export const recursoSetorSchema = z.object({
  setor: z.union([etapaOperacionalSchema, z.literal('expedicao')]),
  label: z.string(),
  operadoresAtivos: z.number().int().nonnegative(),
  operadoresTotal: z.number().int().positive(),
  produtividadeHora: z.number(),
  metaProdutividadeHora: z.number(),
  saturacaoPercent: z.number().min(0).max(100),
});

export type RecursoSetor = z.infer<typeof recursoSetorSchema>;

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

export const timelinePontoSchema = z.object({
  hora: z.string(),
  label: z.string(),
  tipo: z.enum(['inicio', 'pico', 'critico', 'previsao_fim']),
  volumeRelativo: z.number().min(0).max(100),
});

export type TimelinePonto = z.infer<typeof timelinePontoSchema>;

export const docaNivelSchema = z.enum(['livre', 'parcial', 'alto', 'critico']);

export type DocaNivel = z.infer<typeof docaNivelSchema>;

export const docaCelulaSchema = z.object({
  id: z.string(),
  label: z.string(),
  nivel: docaNivelSchema,
  transportesAtivos: z.number().int().nonnegative(),
  tempoMedioOcupacaoMin: z.number(),
  filaEspera: z.number().int().nonnegative(),
  transportes: z.array(
    z.object({
      codigo: z.string(),
      placa: z.string(),
      tempoOcupacaoMin: z.number(),
    }),
  ),
});

export type DocaCelula = z.infer<typeof docaCelulaSchema>;

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
  recursos: z.array(recursoSetorSchema),
  timeline: z.array(timelinePontoSchema),
  docas: z.array(docaCelulaSchema),
  transportes: z.array(transporteRiscoSchema),
  mapas: z.array(mapaResumoSchema),
  alertas: z.array(alertaOperacionalSchema),
  turno: turnoStatusSchema,
});

export type TorreControleSnapshot = z.infer<typeof torreControleSnapshotSchema>;
