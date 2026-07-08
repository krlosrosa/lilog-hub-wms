import { z } from 'zod';

export const debitoTipoSchema = z.enum(['avaria', 'falta', 'misto']);
export type DebitoTipo = z.infer<typeof debitoTipoSchema>;

export const debitoStatusSchema = z.enum([
  'aberto',
  'em_analise',
  'aprovado',
  'incluido_em_documento',
  'cancelado',
]);
export type DebitoStatus = z.infer<typeof debitoStatusSchema>;

export const debitoOcorrenciaSchema = z.object({
  id: z.string(),
  protocolo: z.string(),
  transportadora: z.string(),
  transportadoraId: z.string().uuid().nullable(),
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
  topOfensores: z.array(debitoTopOfensorSchema),
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

export const debitoConferenciaAnomaliaSchema = z.enum(['avaria', 'falta', 'sobra']);
export type DebitoConferenciaAnomalia = z.infer<
  typeof debitoConferenciaAnomaliaSchema
>;

export const debitoItemStatusSchema = z.enum(['cobrar', 'nao_cobrar', 'sobra']);
export type DebitoItemStatus = z.infer<typeof debitoItemStatusSchema>;

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
  nfNumero: z.string(),
  sku: z.string(),
  produto: z.string(),
  lote: z.string().nullable(),
  quantidade: z.number().nonnegative(),
  qtdAnomalia: z.number().nonnegative(),
  pesoTotalKg: z.number().nonnegative().nullable(),
  valorUnitario: z.number().nonnegative().nullable(),
  valorDebito: z.number().nonnegative(),
  anomalia: debitoConferenciaAnomaliaSchema.nullable(),
  status: debitoItemStatusSchema,
  observacao: z.string().nullable(),
});

export type DebitoConferenciaItem = z.infer<typeof debitoConferenciaItemSchema>;

export const debitoRegistroCorteStatusSchema = z.enum([
  'concluido',
  'em_andamento',
  'cancelado',
  'solicitado',
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
  totalVolumes: z.number().int().nonnegative(),
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
});

export type DebitoMapaSeparacao = z.infer<typeof debitoMapaSeparacaoSchema>;

export const debitoInteracaoAutorSchema = z.enum(['transportadora', 'cd']);
export type DebitoInteracaoAutor = z.infer<typeof debitoInteracaoAutorSchema>;

export const debitoInteracaoTipoSchema = z.enum([
  'erro_conferencia',
  'nf_incorreta',
  'avaria_nao_procedente',
  'envio_documento',
  'esclarecimento',
  'outros',
  'solicitacao_prova',
  'parecer',
  'observacao_cd',
]);
export type DebitoInteracaoTipo = z.infer<typeof debitoInteracaoTipoSchema>;

export const debitoInteracaoSchema = z.object({
  id: z.string(),
  autor: debitoInteracaoAutorSchema,
  tipo: debitoInteracaoTipoSchema,
  descricao: z.string(),
  anexoChaves: z.array(z.string()),
  anexoUrls: z.array(z.string()),
  transportadoraId: z.string().uuid().nullable(),
  criadoPorUserId: z.number().int().nullable(),
  createdAt: z.string(),
});
export type DebitoInteracao = z.infer<typeof debitoInteracaoSchema>;

export const debitoDetalheSchema = debitoOcorrenciaSchema.extend({
  demandaId: z.string().uuid(),
  dataIncidente: z.string(),
  pedido: z.string(),
  pesoAfetadoKg: z.number().nonnegative(),
  valorReclamado: z.number().nonnegative(),
  origem: z.string(),
  destino: z.string(),
  motorista: z.string(),
  placaVeiculo: z.string(),
  tipoFrota: z.string(),
  evidencias: z.array(debitoEvidenciaSchema),
  timeline: z.array(debitoTimelineEventoSchema),
  notasFiscais: z.array(debitoNotaFiscalSchema),
  itensConferidos: z.array(debitoConferenciaItemSchema),
  totalAnomalias: z.number().int().nonnegative(),
  registrosCorte: z.array(debitoRegistroCorteSchema),
  mapaSeparacao: debitoMapaSeparacaoSchema.nullable(),
  notasAnalista: z.string(),
  criadaHaDias: z.number().int().nonnegative(),
  interacoes: z.array(debitoInteracaoSchema),
});

export type DebitoDetalhe = z.infer<typeof debitoDetalheSchema>;

export type FiltroTransportadora = 'todas' | string;

export const filtroStatusDebitoSchema = z.enum([
  'todos',
  'aberto',
  'em_analise',
  'aprovado',
  'incluido_em_documento',
  'cancelado',
]);
export type FiltroStatusDebito = z.infer<typeof filtroStatusDebitoSchema>;

export const DEBITO_STATUS_LABELS: Record<DebitoStatus, string> = {
  aberto: 'Aberto',
  em_analise: 'Em Análise',
  aprovado: 'Aprovado',
  incluido_em_documento: 'Incluído em Documento',
  cancelado: 'Cancelado',
};

export const DEBITO_TIPO_LABELS: Record<DebitoTipo, string> = {
  avaria: 'Avaria',
  falta: 'Falta',
  misto: 'Misto',
};

export const DEBITO_ANOMALIA_LABELS: Record<DebitoConferenciaAnomalia, string> =
  {
    avaria: 'Avaria',
    falta: 'Falta',
    sobra: 'Sobra',
  };

export const DEBITO_ITEM_STATUS_LABELS: Record<DebitoItemStatus, string> = {
  cobrar: 'Cobrar',
  nao_cobrar: 'Não Cobrar',
  sobra: 'Sobra',
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
  solicitado: 'Solicitado',
};

export const DEBITO_INTERACAO_TIPO_TRANSPORTADORA_LABELS: Record<
  Extract<
    DebitoInteracaoTipo,
    | 'erro_conferencia'
    | 'nf_incorreta'
    | 'avaria_nao_procedente'
    | 'envio_documento'
    | 'esclarecimento'
    | 'outros'
  >,
  string
> = {
  erro_conferencia: 'Erro na conferência',
  nf_incorreta: 'Nota fiscal incorreta',
  avaria_nao_procedente: 'Avaria não procedente',
  envio_documento: 'Envio de documento',
  esclarecimento: 'Esclarecimento',
  outros: 'Outros',
};

export const DEBITO_INTERACAO_TIPO_CD_LABELS: Record<
  Extract<DebitoInteracaoTipo, 'solicitacao_prova' | 'parecer' | 'observacao_cd'>,
  string
> = {
  solicitacao_prova: 'Solicitação de prova',
  parecer: 'Parecer',
  observacao_cd: 'Observação do CD',
};

export const DEBITO_INTERACAO_TIPO_LABELS: Record<DebitoInteracaoTipo, string> =
  {
    ...DEBITO_INTERACAO_TIPO_TRANSPORTADORA_LABELS,
    ...DEBITO_INTERACAO_TIPO_CD_LABELS,
  };

export const DEBITO_INTERACAO_AUTOR_LABELS: Record<DebitoInteracaoAutor, string> =
  {
    transportadora: 'Transportadora',
    cd: 'Centro de Distribuição',
  };
