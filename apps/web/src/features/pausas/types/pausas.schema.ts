import { z } from 'zod';

export const pausaTipoSchema = z.enum(['termica', 'refeicao', 'outros']);

export type PausaTipo = z.infer<typeof pausaTipoSchema>;

export const pausaTipoRegistroSchema = pausaTipoSchema;

export type PausaTipoRegistro = z.infer<typeof pausaTipoRegistroSchema>;

export const pausaMonitorStatusSchema = z.enum(['em-tempo', 'atrasado']);

export type PausaMonitorStatus = z.infer<typeof pausaMonitorStatusSchema>;

export const pausaRegistroStatusSchema = z.enum(['regular', 'excedente']);

export type PausaRegistroStatus = z.infer<typeof pausaRegistroStatusSchema>;

export const horarioRegex = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export const operadorEmPausaSchema = z.object({
  id: z.string(),
  funcionarioId: z.number().int(),
  nome: z.string(),
  matricula: z.string(),
  tipo: pausaTipoSchema,
  inicio: z.string(),
  previsaoRetorno: z.string(),
  status: pausaMonitorStatusSchema,
  tempoRestante: z.string(),
  pausaId: z.string(),
});

export type OperadorEmPausa = z.infer<typeof operadorEmPausaSchema>;

export const monitorStatsSchema = z.object({
  emPausa: z.number().int().nonnegative(),
  totalOperadores: z.number().int().nonnegative(),
  atrasosCriticos: z.number().int().nonnegative(),
  totalPausadoMinutos: z.number().int().nonnegative(),
  pausaMaisLonga: z.string(),
  pausaMaisLongaOperador: z.string(),
});

export type MonitorStats = z.infer<typeof monitorStatsSchema>;

export const chartDiaSchema = z.object({
  dia: z.string(),
  produtivoPercent: z.number().min(0).max(100),
  pausaPercent: z.number().min(0).max(100),
});

export type ChartDia = z.infer<typeof chartDiaSchema>;

export const relatorioProntoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  geradoEm: z.string(),
  iconVariant: z.enum(['secondary', 'tertiary', 'destructive']),
});

export type RelatorioPronto = z.infer<typeof relatorioProntoSchema>;

export const pausaRegistroDetalheSchema = z.object({
  id: z.string(),
  funcionario: z.string(),
  departamento: z.string(),
  inicio: z.string(),
  fim: z.string(),
  duracao: z.string(),
  tipo: pausaTipoSchema,
  status: pausaRegistroStatusSchema,
});

export type PausaRegistroDetalhe = z.infer<typeof pausaRegistroDetalheSchema>;

export const relatorioFooterKpiSchema = z.object({
  totalPausas: z.number().int().nonnegative(),
  mediaPausaPorTurno: z.string(),
  pausasTermicasMinutos: z.number().int().nonnegative(),
  pausasRefeicaoMinutos: z.number().int().nonnegative(),
});

export type RelatorioFooterKpi = z.infer<typeof relatorioFooterKpiSchema>;

export const relatorioFiltrosSchema = z.object({
  dataReferencia: z.string().min(1),
  funcionario: z.string(),
});

export type RelatorioFiltros = z.infer<typeof relatorioFiltrosSchema>;

export const registroOperadorSchema = z.object({
  id: z.string(),
  funcionarioId: z.number().int(),
  nome: z.string(),
  matricula: z.string(),
});

export type RegistroOperador = z.infer<typeof registroOperadorSchema>;

export const PAUSA_TIPO_LABELS: Record<PausaTipo, string> = {
  termica: 'Térmica',
  refeicao: 'Refeição',
  outros: 'Outros',
};

export const PAUSA_TIPO_REGISTRO_LABELS: Record<PausaTipoRegistro, string> = {
  termica: 'Pausa Térmica',
  refeicao: 'Almoço/Jantar',
  outros: 'Outros',
};

export const PAUSA_TIPO_REGISTRO_DURACAO: Record<PausaTipoRegistro, string> = {
  termica: '20 minutos',
  refeicao: '1h15 minutos',
  outros: 'Conforme necessidade',
};

export const PAUSA_MONITOR_STATUS_LABELS: Record<PausaMonitorStatus, string> = {
  'em-tempo': 'EM TEMPO',
  atrasado: 'ATRASADO',
};

export const PAUSA_REGISTRO_STATUS_LABELS: Record<PausaRegistroStatus, string> =
  {
    regular: 'Regular',
    excedente: 'Excedente',
  };

export const TODOS_FUNCIONARIOS = 'Todos os Colaboradores';

export function getDefaultRelatorioFiltros(): RelatorioFiltros {
  const hoje = new Date().toISOString().slice(0, 10);
  return {
    dataReferencia: hoje,
    funcionario: TODOS_FUNCIONARIOS,
  };
}

export const PAUSA_TIPOS_REGISTRO: readonly PausaTipoRegistro[] = [
  'termica',
  'refeicao',
  'outros',
] as const;
