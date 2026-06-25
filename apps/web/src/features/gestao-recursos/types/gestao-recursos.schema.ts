import { z } from 'zod';

import type { MapaGrupoProcessoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';
import type { SessaoPausaTipoApi } from '@/features/pausas/types/pausas.api';
import type { PausaMonitorStatus } from '@/features/pausas/types/pausas.schema';

export const operatorStatusSchema = z.enum(['atuando', 'ocioso', 'pausa']);
export type OperatorStatus = z.infer<typeof operatorStatusSchema>;

export const taskItemSchema = z.object({
  id: z.string(),
  mapaGrupoId: z.string().optional(),
  processo: z.custom<MapaGrupoProcessoApi>().optional(),
  label: z.string(),
  startTime: z.string().optional(),
  expectedEndTime: z.string().optional(),
  estimatedSeconds: z.number().int().nonnegative().optional(),
  pausaExtraMinutos: z.number().int().nonnegative().optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['em_andamento', 'pendente']).optional(),
  isLate: z.boolean().optional(),
});

export type TaskItem = z.infer<typeof taskItemSchema>;

export const operatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  sector: z.string(),
  status: operatorStatusSchema,
  currentMission: z.string().optional(),
  startTime: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  expectedEnd: z.string().optional(),
  isLate: z.boolean().optional(),
  idleDuration: z.string().optional(),
  idleThreshold: z.number().min(0).max(100).optional(),
  emPausa: z.boolean().optional(),
  pauseDuration: z.string().optional(),
  pauseThreshold: z.number().min(0).max(100).optional(),
  pauseTipo: z.custom<SessaoPausaTipoApi>().optional(),
  pausePrevisaoRetorno: z.string().optional(),
  pauseStatus: z.custom<PausaMonitorStatus>().optional(),
  pauseTempoRestante: z.string().optional(),
  isPauseOverPlanned: z.boolean().optional(),
  pauseElapsedMinutos: z.number().int().nonnegative().optional(),
  precisaPausa: z.boolean().optional(),
  pausaTipoSugerido: z.custom<SessaoPausaTipoApi>().optional(),
  tempoTrabalhoContinuoMinutos: z.number().int().nonnegative().optional(),
  intervaloPausaReferenciaMinutos: z.number().int().nonnegative().optional(),
  duracaoPausaSugeridaMinutos: z.number().int().nonnegative().optional(),
  pausaAtrasoMinutos: z.number().int().nonnegative().optional(),
  pausaTempoRestanteMinutos: z.number().int().nonnegative().optional(),
  pausaDevidaProgress: z.number().min(0).max(100).optional(),
  tasks: z.array(taskItemSchema).optional(),
});

export type Operator = z.infer<typeof operatorSchema>;

export const kpiAccentSchema = z.enum([
  'primary',
  'tertiary',
  'destructive',
  'muted',
  'warning',
]);
export type KpiAccent = z.infer<typeof kpiAccentSchema>;

export const kpiCardSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  suffix: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  trend: z.string().optional(),
  trendIcon: z.enum(['up', 'down', 'none']).optional(),
  footer: z.string().optional(),
  accent: kpiAccentSchema,
});

export type KpiCard = z.infer<typeof kpiCardSchema>;

export const gestaoRecursosSummarySchema = z.object({
  kpis: z.array(kpiCardSchema),
  operators: z.array(operatorSchema),
});

export type GestaoRecursosSummary = z.infer<typeof gestaoRecursosSummarySchema>;
