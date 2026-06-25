import { z } from 'zod';

export const conferenceItemStatusSchema = z.enum([
  'concluido',
  'pendente',
  'divergente',
  'iniciando',
]);

export type ConferenceItemStatus = z.infer<typeof conferenceItemStatusSchema>;

export const conferenceItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  produto: z.string(),
  previsto: z.number().int().nonnegative(),
  confirmado: z.number().int().nonnegative(),
  status: conferenceItemStatusSchema,
});

export type ConferenceItem = z.infer<typeof conferenceItemSchema>;

export const timelineStepStatusSchema = z.enum([
  'completed',
  'active',
  'future',
]);

export type TimelineStepStatus = z.infer<typeof timelineStepStatusSchema>;

export const timelineStepSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  descricao: z.string(),
  status: timelineStepStatusSchema,
  progressoPercent: z.number().int().min(0).max(100).optional(),
});

export type TimelineStep = z.infer<typeof timelineStepSchema>;

export const evidenceSchema = z.object({
  id: z.string(),
  url: z.string().url().optional(),
  alt: z.string(),
  isPlaceholder: z.boolean().default(false),
});

export type Evidence = z.infer<typeof evidenceSchema>;

export const demandaDetalheSchema = z.object({
  id: z.string(),
  placa: z.string(),
  motorista: z.string(),
  viagemId: z.string(),
  status: z.enum(['em-conferencia', 'finalizado', 'aguardando']),
  totalItens: z.number().int().nonnegative(),
  totalItensEsperado: z.number().int().positive(),
  /** Temperatura ambiente do baú refrigerado */
  temperaturaBau: z.number(),
  temperaturaBauAlvo: z.number(),
  /** Temperatura média/registrada da carga (única leitura da remessa) */
  temperaturaProduto: z.number(),
  temperaturaProdutoAlvo: z.number(),
  inicioOperacao: z.string(),
  duracao: z.string(),
  estimativaTermino: z.string(),
  eficiencia: z.number().int().min(0).max(100),
});

export type DemandaDetalhe = z.infer<typeof demandaDetalheSchema>;

export const DETALHE_STATUS_LABELS: Record<DemandaDetalhe['status'], string> = {
  'em-conferencia': 'Em Conferência',
  finalizado: 'Finalizado',
  aguardando: 'Aguardando',
};

export function canReabrirDemanda(status: DemandaDetalhe['status']): boolean {
  return status === 'finalizado';
}

const TEMPERATURA_TOLERANCIA_C = 2;

export function isTemperaturaForaFaixa(
  atual: number,
  alvo: number,
  tolerancia = TEMPERATURA_TOLERANCIA_C,
): boolean {
  return Math.abs(atual - alvo) > tolerancia;
}

export const CONFERENCE_STATUS_LABELS: Record<ConferenceItemStatus, string> = {
  concluido: 'Concluído',
  pendente: 'Pendente',
  divergente: 'Divergente',
  iniciando: 'Iniciando',
};
