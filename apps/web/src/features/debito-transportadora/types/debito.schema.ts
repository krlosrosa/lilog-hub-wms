import { z } from 'zod';

export const debitoTipoSchema = z.enum(['avaria', 'falta']);
export type DebitoTipo = z.infer<typeof debitoTipoSchema>;

export const debitoStatusSchema = z.enum([
  'em_disputa',
  'notificada',
  'pago',
  'aguardando_evidencia',
]);
export type DebitoStatus = z.infer<typeof debitoStatusSchema>;

export const debitoSeveridadeSchema = z.enum(['baixa', 'media', 'alta']);
export type DebitoSeveridade = z.infer<typeof debitoSeveridadeSchema>;

export const debitoOcorrenciaSchema = z.object({
  id: z.string(),
  protocolo: z.string(),
  transportadora: z.string(),
  nfOrigem: z.string(),
  tipo: debitoTipoSchema,
  valor: z.number().nonnegative(),
  status: debitoStatusSchema,
  agingDias: z.number().int().nonnegative(),
});

export type DebitoOcorrencia = z.infer<typeof debitoOcorrenciaSchema>;

export const debitoTopOfensorSchema = z.object({
  nome: z.string(),
  valor: z.number().nonnegative(),
  percentualBarra: z.number().min(0).max(100),
});

export type DebitoTopOfensor = z.infer<typeof debitoTopOfensorSchema>;

export const debitoKpiSchema = z.object({
  prejuizoTotalAberto: z.number().nonnegative(),
  prejuizoVariacaoPercentual: z.number(),
  cobrancasEmDisputa: z.number().nonnegative(),
  casosAtivosDisputa: z.number().int().nonnegative(),
  taxaRecuperacao: z.number().min(0).max(100),
  metaRecuperacao: z.number().min(0).max(100),
  topOfensores: z.array(debitoTopOfensorSchema).min(1),
});

export type DebitoKpi = z.infer<typeof debitoKpiSchema>;

export const debitoEvidenciaSchema = z.object({
  id: z.string(),
  tipo: z.enum(['imagem', 'documento']),
  nome: z.string(),
  url: z.string().optional(),
  tamanhoBytes: z.number().optional(),
  dataUpload: z.string().optional(),
});

export type DebitoEvidencia = z.infer<typeof debitoEvidenciaSchema>;

export const debitoTimelineEventoSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  subtitulo: z.string(),
  descricao: z.string().optional(),
  tipo: z.enum(['concluido', 'ativo', 'pendente']),
});

export type DebitoTimelineEvento = z.infer<typeof debitoTimelineEventoSchema>;

export const debitoConferenciaAnomaliaSchema = z.enum(['avaria', 'falta']);
export type DebitoConferenciaAnomalia = z.infer<
  typeof debitoConferenciaAnomaliaSchema
>;

export const debitoOperacaoNfSchema = z.enum([
  'reentrega',
  'devolucao_parcial',
  'devolucao_total',
]);
export type DebitoOperacaoNf = z.infer<typeof debitoOperacaoNfSchema>;

export const debitoNotaFiscalSchema = z.object({
  id: z.string(),
  numero: z.string(),
  operacao: debitoOperacaoNfSchema,
  pedido: z.string().optional(),
});

export type DebitoNotaFiscal = z.infer<typeof debitoNotaFiscalSchema>;

export const debitoConferenciaItemSchema = z.object({
  id: z.string(),
  nfId: z.string(),
  sku: z.string(),
  produto: z.string(),
  lote: z.string(),
  /** Quantidade declarada na NF / documento fiscal. */
  qtdEsperada: z.number().nonnegative(),
  /** Quantidade conferida fisicamente. */
  qtdConferida: z.number().nonnegative(),
  /** Tipo de anomalia gerada; null quando conferido sem divergência. */
  anomalia: debitoConferenciaAnomaliaSchema.nullable(),
  valorImpacto: z.number().nonnegative().optional(),
});

export type DebitoConferenciaItem = z.infer<typeof debitoConferenciaItemSchema>;

export const debitoRegistroCorteStatusSchema = z.enum([
  'concluido',
  'em_andamento',
  'cancelado',
]);
export type DebitoRegistroCorteStatus = z.infer<
  typeof debitoRegistroCorteStatusSchema
>;

export const debitoRegistroCorteSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  dataHora: z.string(),
  rota: z.string(),
  doca: z.string(),
  totalVolumes: z.number().int().positive(),
  pesoKg: z.number().nonnegative(),
  separador: z.string(),
  status: debitoRegistroCorteStatusSchema,
});

export type DebitoRegistroCorte = z.infer<typeof debitoRegistroCorteSchema>;

export const debitoMapaSeparacaoSchema = z.object({
  codigo: z.string(),
  geradoEm: z.string(),
  totalItens: z.number().int().nonnegative(),
  totalVolumes: z.number().int().nonnegative(),
  nomeArquivo: z.string(),
});

export type DebitoMapaSeparacao = z.infer<typeof debitoMapaSeparacaoSchema>;

export const debitoDetalheSchema = debitoOcorrenciaSchema.extend({
  dataIncidente: z.string(),
  pedido: z.string(),
  pesoAfetadoKg: z.number().nonnegative(),
  valorReclamado: z.number().nonnegative(),
  severidade: debitoSeveridadeSchema,
  origem: z.string(),
  destino: z.string(),
  motorista: z.string(),
  placaVeiculo: z.string(),
  tipoFrota: z.string(),
  monitoramentoAtivo: z.boolean(),
  monitoramentoProgresso: z.number().min(0).max(100),
  ultimoSinal: z.string(),
  evidencias: z.array(debitoEvidenciaSchema),
  timeline: z.array(debitoTimelineEventoSchema),
  notasFiscais: z.array(debitoNotaFiscalSchema).min(1),
  itensConferidos: z.array(debitoConferenciaItemSchema),
  totalAnomalias: z.number().int().nonnegative(),
  registrosCorte: z.array(debitoRegistroCorteSchema),
  mapaSeparacao: debitoMapaSeparacaoSchema,
  reasonCode: z.string(),
  notasAnalista: z.string(),
  criadaHaDias: z.number().int().nonnegative(),
});

export type DebitoDetalhe = z.infer<typeof debitoDetalheSchema>;

export const filtroTransportadoraSchema = z.enum([
  'todas',
  'swift_logistics',
  'global_freight',
  'rapid_way',
]);
export type FiltroTransportadora = z.infer<typeof filtroTransportadoraSchema>;

export const filtroStatusDebitoSchema = z.enum([
  'todos',
  'em_disputa',
  'notificada',
  'pago',
  'aguardando_evidencia',
]);
export type FiltroStatusDebito = z.infer<typeof filtroStatusDebitoSchema>;

export const DEBITO_STATUS_LABELS: Record<DebitoStatus, string> = {
  em_disputa: 'Em Disputa',
  notificada: 'Notificada',
  pago: 'Pago',
  aguardando_evidencia: 'Aguardando Evidência',
};

export const DEBITO_TIPO_LABELS: Record<DebitoTipo, string> = {
  avaria: 'Avaria',
  falta: 'Falta',
};

export const DEBITO_SEVERIDADE_LABELS: Record<DebitoSeveridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

export const DEBITO_ANOMALIA_LABELS: Record<DebitoConferenciaAnomalia, string> =
  {
    avaria: 'Avaria',
    falta: 'Falta',
  };

export const DEBITO_OPERACAO_NF_LABELS: Record<DebitoOperacaoNf, string> = {
  reentrega: 'Reentrega',
  devolucao_parcial: 'Dev. Parcial',
  devolucao_total: 'Dev. Total',
};

export const DEBITO_OPERACAO_NF_SHORT: Record<DebitoOperacaoNf, string> = {
  reentrega: 'Reent.',
  devolucao_parcial: 'Dev. Parc.',
  devolucao_total: 'Dev. Tot.',
};

export const DEBITO_REGISTRO_CORTE_STATUS_LABELS: Record<
  DebitoRegistroCorteStatus,
  string
> = {
  concluido: 'Concluído',
  em_andamento: 'Em andamento',
  cancelado: 'Cancelado',
};

export const REASON_CODES = [
  'Avaria no Transporte (Empilhamento Indevido)',
  'Extravio Parcial',
  'Violação de Lacre',
  'Umidade / Molhadura',
] as const;
