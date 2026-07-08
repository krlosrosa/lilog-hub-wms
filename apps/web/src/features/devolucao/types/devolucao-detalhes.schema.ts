import { z } from 'zod';

import { demandaDevolucaoStatusSchema } from '@/features/devolucao/types/devolucao-gestao.schema';
import type { DemandaDevolucaoStatus } from '@/features/devolucao/types/devolucao-gestao.schema';
import {
  devolucaoItemCondicaoSchema,
  type DevolucaoItemCondicao,
} from '@/features/devolucao/types/devolucao-buscar.schema';

export const conferenceItemStatusSchema = z.enum([
  'concluido',
  'pendente',
  'divergente',
  'iniciando',
  'ajuste-peso',
]);

export type ConferenceItemStatus = z.infer<typeof conferenceItemStatusSchema>;

export const conferenceItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  produto: z.string(),
  previsto: z.number().int().nonnegative(),
  confirmado: z.number().int().nonnegative(),
  status: conferenceItemStatusSchema,
  condicao: devolucaoItemCondicaoSchema,
  pesoVariavel: z.boolean().optional(),
  diferencaPesoKg: z.number().nullable().optional(),
  quantidadeFiscalOriginal: z.number().nullable().optional(),
  faltaPesoId: z.string().uuid().nullable().optional(),
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
  codigoDemanda: z.string(),
  placa: z.string(),
  motorista: z.string(),
  viagemId: z.string(),
  status: z.enum([
    'aguardando',
    'aguardando-conferencia',
    'em-conferencia',
    'conferido',
    'finalizado',
    'cancelada',
  ]),
  statusDb: demandaDevolucaoStatusSchema.optional(),
  observacao: z.string().nullable().optional(),
  totalNfs: z.number().int().nonnegative().optional(),
  pesoDevolvido: z.number().nonnegative().optional(),
  cliente: z.string().nullable().optional(),
  transporteId: z.string().nullable().optional(),
  totalItens: z.number().int().nonnegative(),
  totalItensEsperado: z.number().int().positive(),
  /** Temperatura ambiente do baú refrigerado */
  temperaturaBau: z.number().nullable(),
  temperaturaBauAlvo: z.number().nullable(),
  /** Temperatura média/registrada da carga (única leitura da remessa) */
  temperaturaProduto: z.number().nullable(),
  temperaturaProdutoAlvo: z.number().nullable(),
  inicioOperacao: z.string(),
  duracao: z.string(),
  estimativaTermino: z.string(),
  eficiencia: z.number().int().min(0).max(100).nullable(),
});

export type DemandaDetalhe = z.infer<typeof demandaDetalheSchema>;

export const DETALHE_STATUS_LABELS: Record<DemandaDetalhe['status'], string> = {
  aguardando: 'Aguardando',
  'aguardando-conferencia': 'Aguardando Conferência',
  'em-conferencia': 'Em Conferência',
  conferido: 'Conferido',
  finalizado: 'Finalizado',
  cancelada: 'Cancelada',
};

export function canReabrirDemanda(
  status: DemandaDetalhe['status'],
  statusDb?: DemandaDevolucaoStatus,
): boolean {
  if (statusDb) return statusDb === 'conferida';
  return status === 'conferido';
}

export function canFinalizarDemanda(
  status: DemandaDetalhe['status'],
  statusDb?: DemandaDevolucaoStatus,
): boolean {
  if (statusDb) return statusDb === 'conferida';
  return status === 'conferido';
}

export function canLiberarArmazem(
  status: DemandaDetalhe['status'],
  statusDb?: DemandaDevolucaoStatus,
): boolean {
  if (statusDb) return statusDb === 'aberta';
  return status === 'aguardando';
}

export function canRegistrarDemandaFalta(
  status: DemandaDetalhe['status'],
  statusDb?: DemandaDevolucaoStatus,
): boolean {
  if (statusDb) return statusDb === 'aberta';
  return status === 'aguardando';
}

export function canDeletarDemanda(
  status: DemandaDetalhe['status'],
  statusDb?: DemandaDevolucaoStatus,
): boolean {
  if (statusDb) return statusDb !== 'concluida';
  return status !== 'finalizado';
}

export function isDemandaAtiva(status: DemandaDetalhe['status']): boolean {
  return (
    status === 'aguardando' ||
    status === 'aguardando-conferencia' ||
    status === 'em-conferencia' ||
    status === 'conferido'
  );
}

const TEMPERATURA_TOLERANCIA_C = 2;

export function isTemperaturaForaFaixa(
  atual: number | null,
  alvo: number | null,
  tolerancia = TEMPERATURA_TOLERANCIA_C,
): boolean {
  if (atual === null || alvo === null) return false;
  return Math.abs(atual - alvo) > tolerancia;
}

export const CONFERENCE_STATUS_LABELS: Record<ConferenceItemStatus, string> = {
  concluido: 'Concluído',
  pendente: 'Pendente',
  divergente: 'Divergente',
  iniciando: 'Iniciando',
  'ajuste-peso': 'Ajuste peso',
};

export type ConferenceItemCondicaoFiltro = 'todos' | DevolucaoItemCondicao;

export const FILTROS_CONDICAO: readonly ConferenceItemCondicaoFiltro[] = [
  'todos',
  'integro',
  'avariado',
  'vencido',
  'violado',
  'nao_identificado',
] as const;

export const FILTRO_CONDICAO_LABELS: Record<ConferenceItemCondicaoFiltro, string> = {
  todos: 'Todos',
  integro: 'Íntegro',
  avariado: 'Avariado',
  vencido: 'Vencido',
  violado: 'Violado',
  nao_identificado: 'Não Identificado',
};
