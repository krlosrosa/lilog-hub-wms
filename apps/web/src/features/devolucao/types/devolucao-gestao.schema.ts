import { z } from 'zod';

export const demandaStatusSchema = z.enum([
  'em-progresso',
  'atrasado',
  'finalizado',
  'aguardando-chegada',
]);

export type DemandaStatus = z.infer<typeof demandaStatusSchema>;

export const demandaTipoSchema = z.enum(['carga', 'descarga']);

export type DemandaTipo = z.infer<typeof demandaTipoSchema>;

export const demandaFiltroTipoSchema = z.enum([
  'todos',
  'carregamento',
  'descarregamento',
]);

export type DemandaFiltroTipo = z.infer<typeof demandaFiltroTipoSchema>;

export const horarioRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const demandaItemSchema = z.object({
  id: z.string(),
  doca: z.string(),
  veiculo: z.string(),
  placa: z.string(),
  motorista: z.string(),
  tipo: demandaTipoSchema,
  progresso: z.number().int().min(0).max(100),
  previsao: z.string().regex(horarioRegex),
  status: demandaStatusSchema,
});

export type DemandaItem = z.infer<typeof demandaItemSchema>;

export const dockSlotStatusSchema = z.enum([
  'ativa',
  'livre',
  'critica',
  'finalizada',
]);

export type DockSlotStatus = z.infer<typeof dockSlotStatusSchema>;

export const dockSlotSchema = z.object({
  numero: z.number().int().positive(),
  status: dockSlotStatusSchema,
});

export type DockSlot = z.infer<typeof dockSlotSchema>;

export const operatorLeaderboardSchema = z.object({
  id: z.string(),
  nome: z.string(),
  movimentacoesPorHora: z.number().int().positive(),
  eficiencia: z.number().int().min(0).max(100),
  rank: z.number().int().positive(),
});

export type OperatorLeaderboard = z.infer<typeof operatorLeaderboardSchema>;

export const gestaoStatsSchema = z.object({
  demandasAtivas: z.number().int().nonnegative(),
  demandasTotal: z.number().int().positive(),
  tempoMedioMinutos: z.number().int().nonnegative(),
  tempoMedioSegundos: z.number().int().min(0).max(59),
  ocupacaoDocasPercent: z.number().int().min(0).max(100),
  docasOcupadas: z.number().int().nonnegative(),
  docasTotal: z.number().int().positive(),
  veiculosAtrasados: z.number().int().nonnegative(),
  mediaGiroDoca: z.number().positive(),
});

export type GestaoStats = z.infer<typeof gestaoStatsSchema>;

export const DEMANDA_STATUS_LABELS: Record<DemandaStatus, string> = {
  'em-progresso': 'Em Progresso',
  atrasado: 'Atrasado',
  finalizado: 'Finalizado',
  'aguardando-chegada': 'Aguardando Chegada',
};

export function canRegistrarChegada(status: DemandaStatus): boolean {
  return status === 'aguardando-chegada';
}

export const DEMANDA_TIPO_LABELS: Record<DemandaTipo, string> = {
  carga: 'Carga',
  descarga: 'Descarga',
};

export const FILTRO_TIPO_LABELS: Record<DemandaFiltroTipo, string> = {
  todos: 'Todos',
  carregamento: 'Carregamento',
  descarregamento: 'Descarregamento',
};

export const FILTROS_TIPO: readonly DemandaFiltroTipo[] = [
  'todos',
  'carregamento',
  'descarregamento',
] as const;
