import { z } from 'zod';

export const corteStatusSchema = z.enum([
  'solicitado',
  'em_andamento',
  'concluido',
  'cancelado',
]);

export type CorteStatus = z.infer<typeof corteStatusSchema>;

export const filtroCorteStatusSchema = z.enum([
  'todos',
  'solicitado',
  'em_andamento',
  'concluido',
  'cancelado',
]);

export type FiltroCorteStatus = z.infer<typeof filtroCorteStatusSchema>;

export const corteItemSchema = z.object({
  id: z.string(),
  mapaGrupoItemId: z.string(),
  sku: z.string(),
  descricao: z.string().nullable(),
  remessa: z.string(),
  cliente: z.string(),
  lote: z.string().nullable(),
  quantidadeMapa: z.number(),
  quantidadeCorte: z.number(),
  unidadeMedida: z.string(),
  pesoKg: z.number().nullable(),
});

export type CorteItem = z.infer<typeof corteItemSchema>;

export const corteListaItemSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  mapaGrupoMicroUuid: z.string(),
  mapaGrupoTitulo: z.string(),
  rota: z.string(),
  doca: z.string().nullable(),
  status: corteStatusSchema,
  totalVolumes: z.number().nullable(),
  pesoTotalKg: z.number().nullable(),
  solicitadoPorNome: z.string().nullable(),
  solicitadoEm: z.string(),
  realizadoPorNome: z.string().nullable(),
  realizadoEm: z.string().nullable(),
});

export type CorteListaItem = z.infer<typeof corteListaItemSchema>;

export const corteDetalheSchema = corteListaItemSchema.extend({
  unidadeId: z.string(),
  mapaGrupoId: z.string(),
  transporteId: z.string(),
  motivo: z.string().nullable(),
  observacao: z.string().nullable(),
  canceladoPorNome: z.string().nullable(),
  canceladoEm: z.string().nullable(),
  motivoCancelamento: z.string().nullable(),
  itens: z.array(corteItemSchema),
});

export type CorteDetalhe = z.infer<typeof corteDetalheSchema>;

export const mapaGrupoItemCorteSchema = z.object({
  id: z.string(),
  sku: z.string(),
  descricao: z.string().nullable(),
  remessa: z.string(),
  cliente: z.string(),
  lote: z.string().nullable(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  peso: z.number().nullable(),
});

export type MapaGrupoItemCorte = z.infer<typeof mapaGrupoItemCorteSchema>;

export const mapaGrupoCorteSchema = z.object({
  id: z.string(),
  microUuid: z.string(),
  titulo: z.string(),
  subtitulo: z.string().nullable(),
  transporteId: z.string(),
  transporteRota: z.string(),
  totalItens: z.number(),
  pesoTotalKg: z.number(),
  itens: z.array(mapaGrupoItemCorteSchema),
});

export type MapaGrupoCorte = z.infer<typeof mapaGrupoCorteSchema>;

export const CORTE_STATUS_LABELS: Record<CorteStatus, string> = {
  solicitado: 'Solicitado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const FILTRO_CORTE_STATUS_LABELS: Record<FiltroCorteStatus, string> = {
  todos: 'Todos',
  solicitado: 'Solicitado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export type ItemSelecionadoCorte = {
  mapaGrupoItemId: string;
  selecionado: boolean;
  quantidadeCorte: number;
  quantidadeMapa: number;
};
