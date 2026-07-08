import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TransporteCodigoSchema } from './gerar-mapas.dto.js';

const etapaOperacionalSchema = z.enum([
  'separacao',
  'conferencia',
  'carregamento',
  'finalizado',
]);

const nivelRiscoSchema = z.enum(['critico', 'alto', 'medio', 'baixo']);

const processoStatusSchema = z.enum(['pendente', 'em_andamento', 'concluido']);

const statusProcessosSchema = z.object({
  separacao: processoStatusSchema,
  conferencia: processoStatusSchema,
  carregamento: processoStatusSchema,
});

const alertSeveritySchema = z.enum(['error', 'warning', 'info']);

const nivelPrioridadeTorreSchema = z.enum([
  'urgente',
  'prioritaria',
  'normal',
  'baixa',
]);

const horarioProcessoSchema = z.object({
  inicio: z.string().nullable(),
  fim: z.string().nullable(),
});

const horariosProcessosSchema = z.object({
  separacao: horarioProcessoSchema,
  conferencia: horarioProcessoSchema,
  carregamento: horarioProcessoSchema,
});

const statusTransporteTorreSchema = z.enum([
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

export const TransporteRiscoTorreSchema = z.object({
  id: TransporteCodigoSchema,
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
  tempoRestanteSaidaMin: z.number().int(),
  tempoRestanteSaidaSeg: z.number().int(),
  tempoEstimadoFinalizarMin: z.number().int(),
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

export const MapaResumoTorreSchema = z.object({
  id: z.string().uuid(),
  codigo: z.string(),
  transporteId: TransporteCodigoSchema,
  transporteCodigo: z.string(),
  etapa: etapaOperacionalSchema,
  status: processoStatusSchema,
  horarioInicio: z.string().nullable(),
  horarioFim: z.string().nullable(),
  tempoParadoMin: z.number().int().nonnegative(),
  tempoParadoSeg: z.number().int().nonnegative(),
  operador: z.string().optional(),
  prioridade: z.boolean(),
});

export const EtapaPipelineTorreSchema = z.object({
  etapa: etapaOperacionalSchema,
  label: z.string(),
  qtdMapas: z.number().int().nonnegative(),
  tempoMedioParadoMin: z.number(),
  volumeAcumuladoPaletes: z.number().int().nonnegative(),
  capacidadeHora: z.number(),
  isGargalo: z.boolean(),
  saturacaoPercent: z.number().min(0).max(100),
});

export const RecursoSetorTorreSchema = z.object({
  setor: z.union([etapaOperacionalSchema, z.literal('expedicao')]),
  label: z.string(),
  operadoresAtivos: z.number().int().nonnegative(),
  operadoresTotal: z.number().int().positive(),
  produtividadeHora: z.number(),
  metaProdutividadeHora: z.number(),
  saturacaoPercent: z.number().min(0).max(100),
});

export const AlertaOperacionalTorreSchema = z.object({
  id: z.string(),
  tipo: z.enum([
    'prioridade_nao_iniciada',
    'prioridade_atrasada',
    'atraso_iminente',
    'fila_conferencia',
    'baixa_produtividade',
    'recursos_insuficientes',
  ]),
  severity: alertSeveritySchema,
  title: z.string(),
  description: z.string(),
  timeAgo: z.string(),
  entityId: z.string().optional(),
  sectionId: z.string().optional(),
});

export const TimelinePontoTorreSchema = z.object({
  hora: z.string(),
  label: z.string(),
  tipo: z.enum(['inicio', 'pico', 'critico', 'previsao_fim']),
  volumeRelativo: z.number().min(0).max(100),
});

export const TorreControleKpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  suffix: z.string().optional(),
  footer: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  accent: z.enum(['primary', 'muted', 'destructive', 'tertiary', 'warning']),
});

export const TurnoStatusTorreSchema = z.object({
  sessaoId: z.string(),
  turnoLabel: z.string(),
  inicio: z.string(),
  fim: z.string(),
  progressoPercent: z.number().min(0).max(100),
  previsaoConclusao: z.string(),
  transportesEmRisco: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(),
});

export const TorreControleSnapshotSchema = z.object({
  kpis: z.array(TorreControleKpiSchema),
  pipeline: z.array(EtapaPipelineTorreSchema),
  recursos: z.array(RecursoSetorTorreSchema),
  timeline: z.array(TimelinePontoTorreSchema),
  docas: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
  transportes: z.array(TransporteRiscoTorreSchema),
  mapas: z.array(MapaResumoTorreSchema),
  alertas: z.array(AlertaOperacionalTorreSchema),
  turno: TurnoStatusTorreSchema,
});

export class TorreControleSnapshotDto extends createZodDto(
  TorreControleSnapshotSchema,
) {}

export const ObterTorreControleQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  uploadLoteId: z.string().uuid(),
  sessaoId: z.string().uuid().optional(),
});

export class ObterTorreControleQueryDto extends createZodDto(
  ObterTorreControleQuerySchema,
) {}

export type TorreControleSnapshot = z.infer<typeof TorreControleSnapshotSchema>;
