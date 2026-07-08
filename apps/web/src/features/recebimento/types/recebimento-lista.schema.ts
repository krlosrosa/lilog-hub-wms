import { z } from 'zod';

export const recebimentoStatusSchema = z.enum([
  'agendado',
  'aguardando',
  'liberado_para_conferencia',
  'em_conferencia',
  'conferido',
  'finalizado',
  'cancelado',
]);

export type RecebimentoStatus = z.infer<typeof recebimentoStatusSchema>;

export const RECEBIMENTO_STATUS_LABELS: Record<RecebimentoStatus, string> = {
  agendado: 'Agendado',
  aguardando: 'Aguardando',
  liberado_para_conferencia: 'Liberado p/ conferência',
  em_conferencia: 'Em conferência',
  conferido: 'Conferido',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

export const filtroTurnoSchema = z.enum([
  'todos',
  'manha',
  'tarde',
  'atrasados',
]);

export type FiltroTurno = z.infer<typeof filtroTurnoSchema>;

export const docaStatusSchema = z.enum([
  'ocupada',
  'disponivel',
  'manutencao',
]);

export type DocaStatus = z.infer<typeof docaStatusSchema>;

/** HH:mm formato 24h */
export const horarioRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const recebimentoListaItemSchema = z.object({
  id: z.string(),
  placa: z.string(),
  transportador: z.string(),
  /** HH:mm */
  horario: z.string().regex(horarioRegex, 'Horário deve estar no formato HH:mm'),
  horarioPrevisto: z.string(),
  empresas: z.array(z.string()).min(1),
  status: recebimentoStatusSchema,
  volumeUn: z.number().int().nonnegative(),
  isAtrasado: z.boolean(),
});

export type RecebimentoListaItem = z.infer<typeof recebimentoListaItemSchema>;

export const docaItemSchema = z.object({
  numero: z.number().int().positive(),
  status: docaStatusSchema,
  placa: z.string().optional(),
  /** Ex.: etiqueta especial para manutenção */
  etiquetaManutencao: z.string().optional(),
  /** Capacidade máxima em toneladas — usada no filtro Pequenas/Grandes */
  capacidadeToneladas: z.number().int().positive().optional(),
  /** Tempo restante de ocupação (ex.: "1h 45m") */
  tempoOcupacao: z.string().optional(),
  /** Indica recebimento prioritário na doca ocupada */
  isPrioritaria: z.boolean().optional(),
  /** Previsão de retorno da manutenção (ex.: "4h") */
  retornoManutencao: z.string().optional(),
});

export type DocaItem = z.infer<typeof docaItemSchema>;

export const FILTRO_TURNO_LABELS: Record<FiltroTurno, string> = {
  todos: 'Todos',
  manha: 'Manhã',
  tarde: 'Tarde',
  atrasados: 'Atrasados',
};

export const FILTROS_TURNO: readonly FiltroTurno[] = [
  'todos',
  'manha',
  'tarde',
  'atrasados',
] as const;
