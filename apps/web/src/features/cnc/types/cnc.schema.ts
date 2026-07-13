import { z } from 'zod';

import { cncImpressaoOpcoesSchema } from '@/features/cnc/types/cnc-impressao.schema';

export const cncSituacaoSchema = z.enum([
  'pendente',
  'em_analise',
  'encerrada',
  'cancelada',
]);
export type CncSituacao = z.infer<typeof cncSituacaoSchema>;

export const cncResponsavelSchema = z.enum([
  'transportadora',
  'fornecedor',
  'fabrica',
  'operacao',
  'indeterminado',
]);
export type CncResponsavel = z.infer<typeof cncResponsavelSchema>;

export const cncOrigemSchema = z.enum(['recebimento']);
export type CncOrigem = z.infer<typeof cncOrigemSchema>;

export const cncSubtipoOcorrenciaSchema = z.enum([
  'falta',
  'sobra',
  'avaria',
  'lote_divergente',
  'peso_divergente',
  'validade_divergente',
  'produto_nao_previsto',
]);
export type CncSubtipoOcorrencia = z.infer<typeof cncSubtipoOcorrenciaSchema>;

export const cncItemTipoSchema = z.enum(['divergencia', 'avaria']);
export type CncItemTipo = z.infer<typeof cncItemTipoSchema>;

export const cncTratativaTipoSchema = z.enum([
  'imediata',
  'corretiva',
  'preventiva',
]);
export type CncTratativaTipo = z.infer<typeof cncTratativaTipoSchema>;

export const cncTratativaStatusSchema = z.enum([
  'pendente',
  'concluida',
  'cancelada',
]);
export type CncTratativaStatus = z.infer<typeof cncTratativaStatusSchema>;

export const cncListItemSchema = z.object({
  id: z.string().uuid(),
  numero: z.string(),
  origem: cncOrigemSchema,
  origemId: z.string().uuid(),
  unidadeId: z.string(),
  responsavel: cncResponsavelSchema,
  responsavelId: z.string().nullable(),
  descricao: z.string().nullable(),
  situacao: cncSituacaoSchema,
  valorDebito: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CncListItem = z.infer<typeof cncListItemSchema>;

export const cncItemSchema = z.object({
  id: z.string().uuid(),
  cncId: z.string().uuid(),
  tipo: cncItemTipoSchema,
  referenciaId: z.string().uuid(),
  produtoId: z.string().nullable(),
  sku: z.string().nullable(),
  descricaoProduto: z.string().nullable(),
  subtipoOcorrencia: cncSubtipoOcorrenciaSchema.nullable(),
  quantidadeEsperada: z.number().nullable(),
  quantidadeRecebida: z.number().nullable(),
  quantidadeDivergente: z.number().nullable(),
  quantidadeCaixas: z.number().int().nullable(),
  quantidadeUnidades: z.number().int().nullable(),
  unidadeMedida: z.string().nullable(),
  loteEsperado: z.string().nullable(),
  loteRecebido: z.string().nullable(),
  validadeEsperada: z.string().nullable(),
  validadeRecebida: z.string().nullable(),
  pesoEsperado: z.number().nullable(),
  pesoRecebido: z.number().nullable(),
  naturezaAvaria: z.string().nullable(),
  causaAvaria: z.string().nullable(),
  tipoAvaria: z.string().nullable(),
  shelfLifeDias: z.number().int().nullable(),
  descricaoDetalhe: z.string().nullable(),
  responsavelSugerido: cncResponsavelSchema.nullable(),
  createdAt: z.string(),
});

export type CncItem = z.infer<typeof cncItemSchema>;

export const cncItemListadoSchema = cncItemSchema.extend({
  cncNumero: z.string(),
  cncSituacao: cncSituacaoSchema,
});

export type CncItemListado = z.infer<typeof cncItemListadoSchema>;

export const cncEventoSchema = z.object({
  id: z.string().uuid(),
  cncId: z.string().uuid(),
  tipoEvento: z.string(),
  situacaoAnterior: z.string().nullable(),
  situacaoNova: z.string().nullable(),
  descricao: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  criadoPorUserId: z.number().int().nullable(),
  createdAt: z.string(),
});

export type CncEvento = z.infer<typeof cncEventoSchema>;

export const cncTratativaSchema = z.object({
  id: z.string().uuid(),
  cncId: z.string().uuid(),
  tipo: cncTratativaTipoSchema,
  descricao: z.string(),
  responsavelTipo: cncResponsavelSchema,
  prazo: z.string().nullable(),
  concluidaEm: z.string().nullable(),
  concluidaPorUserId: z.number().int().nullable(),
  status: cncTratativaStatusSchema,
  criadoPorUserId: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CncTratativa = z.infer<typeof cncTratativaSchema>;

export const cncDetalheSchema = cncListItemSchema.extend({
  observacao: z.string().nullable(),
  solicitanteId: z.number().int(),
  analistaId: z.number().int().nullable(),
  iniciadoEm: z.string().nullable(),
  encerradoEm: z.string().nullable(),
  encerradoPorUserId: z.number().int().nullable(),
  opcoesImpressao: cncImpressaoOpcoesSchema.nullable(),
  itens: z.array(cncItemSchema),
  tratativas: z.array(cncTratativaSchema),
  eventos: z.array(cncEventoSchema),
});

export type CncDetalhe = z.infer<typeof cncDetalheSchema>;

export const cncKpiSchema = z.object({
  total: z.number().int().nonnegative(),
  pendentes: z.number().int().nonnegative(),
  emAnalise: z.number().int().nonnegative(),
  encerradas: z.number().int().nonnegative(),
  canceladas: z.number().int().nonnegative(),
});

export type CncKpi = z.infer<typeof cncKpiSchema>;

export const filtroSituacaoCncSchema = z.enum([
  'todos',
  'pendente',
  'em_analise',
  'encerrada',
  'cancelada',
]);
export type FiltroSituacaoCnc = z.infer<typeof filtroSituacaoCncSchema>;

export const CNC_SITUACAO_LABELS: Record<CncSituacao, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
};

export const CNC_RESPONSAVEL_LABELS: Record<CncResponsavel, string> = {
  transportadora: 'Transportadora',
  fornecedor: 'Fornecedor',
  fabrica: 'Fábrica',
  operacao: 'Operação',
  indeterminado: 'Indeterminado',
};

export const CNC_ORIGEM_LABELS: Record<CncOrigem, string> = {
  recebimento: 'Recebimento',
};

export const CNC_ITEM_TIPO_LABELS: Record<CncItemTipo, string> = {
  divergencia: 'Divergência',
  avaria: 'Avaria',
};

export const CNC_SUBTIPO_LABELS: Record<CncSubtipoOcorrencia, string> = {
  falta: 'Falta',
  sobra: 'Sobra',
  avaria: 'Avaria',
  lote_divergente: 'Lote divergente',
  peso_divergente: 'Divergência de Peso',
  validade_divergente: 'Validade divergente',
  produto_nao_previsto: 'Produto não previsto',
};

export const CNC_TRATATIVA_TIPO_LABELS: Record<CncTratativaTipo, string> = {
  imediata: 'Imediata',
  corretiva: 'Corretiva',
  preventiva: 'Preventiva',
};

export const CNC_TRATATIVA_STATUS_LABELS: Record<CncTratativaStatus, string> = {
  pendente: 'Pendente',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const CNC_EVENTO_LABELS: Record<string, string> = {
  CNC_CRIADA: 'CNC criada',
  ANALISE_INICIADA: 'Análise iniciada',
  ENCERRADA: 'CNC encerrada',
  CANCELADA: 'CNC cancelada',
  TRATATIVA_ADICIONADA: 'Tratativa adicionada',
  TRATATIVA_CONCLUIDA: 'Tratativa concluída',
  ITEM_ATUALIZADO: 'Item atualizado',
  ITEM_REMOVIDO: 'Item removido',
};
