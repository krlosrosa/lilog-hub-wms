import { z } from 'zod';

export const documentoCobrancaStatusSchema = z.enum([
  'rascunho',
  'emitido',
  'enviado',
  'pago',
  'cancelado',
]);
export type DocumentoCobrancaStatus = z.infer<
  typeof documentoCobrancaStatusSchema
>;

export const documentoCobrancaListItemSchema = z.object({
  id: z.string(),
  numeroDocumento: z.string(),
  transportadora: z.string(),
  transportadoraId: z.string().uuid().nullable(),
  status: documentoCobrancaStatusSchema,
  valorTotal: z.number().nonnegative(),
  quantidadeProcessos: z.number().int().nonnegative(),
  quantidadeItens: z.number().int().nonnegative(),
  emitidoEm: z.string().nullable(),
  enviadoEm: z.string().nullable(),
  pagoEm: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DocumentoCobrancaListItem = z.infer<
  typeof documentoCobrancaListItemSchema
>;

export const documentoCobrancaItemSchema = z.object({
  id: z.string(),
  processoDebitoId: z.string(),
  processoDebitoItemId: z.string(),
  valorDebito: z.number().nonnegative(),
  demandaId: z.string(),
  codigoDemanda: z.string(),
  sku: z.string().nullable(),
  tipo: z.enum(['falta', 'avaria', 'sobra']),
  createdAt: z.string(),
});

export type DocumentoCobrancaItem = z.infer<typeof documentoCobrancaItemSchema>;

export const documentoTimelineEventoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  subtitulo: z.string(),
  descricao: z.string().optional(),
  tipo: z.enum(['concluido', 'ativo', 'pendente']),
});

export type DocumentoTimelineEvento = z.infer<
  typeof documentoTimelineEventoSchema
>;

export const documentoCobrancaDetalheSchema = documentoCobrancaListItemSchema.extend({
  observacao: z.string().nullable(),
  itens: z.array(documentoCobrancaItemSchema),
  timeline: z.array(documentoTimelineEventoSchema),
});

export type DocumentoCobrancaDetalhe = z.infer<
  typeof documentoCobrancaDetalheSchema
>;

export const filtroStatusDocumentoSchema = z.enum([
  'todos',
  'rascunho',
  'emitido',
  'enviado',
  'pago',
  'cancelado',
]);
export type FiltroStatusDocumento = z.infer<typeof filtroStatusDocumentoSchema>;

export type FiltroTransportadoraDocumento = 'todas' | string;

export const DOCUMENTO_STATUS_LABELS: Record<DocumentoCobrancaStatus, string> =
  {
    rascunho: 'Rascunho',
    emitido: 'Emitido',
    enviado: 'Enviado',
    pago: 'Pago',
    cancelado: 'Cancelado',
  };

export const DOCUMENTO_TIPO_LABELS: Record<
  DocumentoCobrancaItem['tipo'],
  string
> = {
  falta: 'Falta',
  avaria: 'Avaria',
  sobra: 'Sobra',
};

export type AcaoDocumentoConfirmacao =
  | 'emitir'
  | 'enviar'
  | 'marcarPago'
  | 'cancelar';
