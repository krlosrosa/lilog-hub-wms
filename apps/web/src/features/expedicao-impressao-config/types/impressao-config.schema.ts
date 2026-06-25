import { z } from 'zod';

import type { OpcoesTabelasCarregamento } from '@/features/expedicao-impressao-config/types/carregamento-tabelas.schema';
import {
  DEFAULT_OPCOES_TABELAS_CARREGAMENTO,
  opcoesTabelasCarregamentoSchema,
} from '@/features/expedicao-impressao-config/types/carregamento-tabelas.schema';

export const tipoQuebraSchema = z.enum(['porcentual', 'quantidade', 'linhas']);

export type TipoQuebra = z.infer<typeof tipoQuebraSchema>;

export const TIPO_QUEBRA_LABELS: Record<TipoQuebra, string> = {
  porcentual: 'Porcentual',
  quantidade: 'Quantidade',
  linhas: 'Linhas',
};

export const quebraPaleteConfigSchema = z.object({
  ativa: z.boolean(),
  tipo: tipoQuebraSchema,
  percentual: z.number().min(0).max(100),
});

export type QuebraPaleteConfig = z.infer<typeof quebraPaleteConfigSchema>;

export const faixaFifoSchema = z.enum(['amarelo', 'laranja', 'vermelho']);

export type FaixaFifo = z.infer<typeof faixaFifoSchema>;

export const FAIXA_FIFO_LABELS: Record<FaixaFifo, string> = {
  amarelo: 'Amarelo',
  laranja: 'Laranja',
  vermelho: 'Vermelho',
};

export const FAIXAS_FIFO_OPCOES = faixaFifoSchema.options;

export const opcoesSeparacaoSchema = z.object({
  separarPaletesCompletos: z.boolean(),
  separarUnidadesIndividuais: z.boolean(),
  segregarFifo: z.boolean(),
  faixasFifo: z.array(faixaFifoSchema),
  percentualMaximoDataFifo: z.number().min(0).max(100),
});

export type OpcoesSeparacao = z.infer<typeof opcoesSeparacaoSchema>;

export const ordemImpressaoItemSchema = z.enum([
  'endereco',
  'sku',
  'descricao',
  'lote',
  'data_maxima',
  'data_minima',
  'quantidade_unidade',
  'quantidade_caixa',
  'quantidade_palete',
  'faixa',
]);

export type OrdemImpressaoItem = z.infer<typeof ordemImpressaoItemSchema>;

export const ORDEM_IMPRESSAO_LABELS: Record<OrdemImpressaoItem, string> = {
  endereco: 'Endereço',
  sku: 'SKU',
  descricao: 'Descrição',
  lote: 'Lote',
  data_maxima: 'Data Máxima',
  data_minima: 'Data Mínima',
  quantidade_unidade: 'Quantidade Unidade',
  quantidade_caixa: 'Quantidade Caixa',
  quantidade_palete: 'Quantidade Palete',
  faixa: 'Faixa',
};

export const ALL_ORDEM_IMPRESSAO_ITEMS = ordemImpressaoItemSchema.options;

export const ordemImpressaoContextSchema = z.enum(['separacao', 'conferencia']);

export type OrdemImpressaoContext = z.infer<typeof ordemImpressaoContextSchema>;

export const ORDEM_IMPRESSAO_CONTEXT_LABELS: Record<OrdemImpressaoContext, string> = {
  separacao: 'Separação',
  conferencia: 'Conferência',
};

export const layoutCabecalhoSchema = z.object({
  separacao: z.string(),
  conferencia: z.string(),
  carregamento: z.string(),
});

export type LayoutCabecalho = z.infer<typeof layoutCabecalhoSchema>;

export const posicaoQrCodeSchema = z.enum([
  'superior_esquerdo',
  'superior_direito',
  'inferior_esquerdo',
  'inferior_direito',
  'no_html',
]);

export type PosicaoQrCode = z.infer<typeof posicaoQrCodeSchema>;

export const POSICAO_QR_CODE_LABELS: Record<PosicaoQrCode, string> = {
  superior_esquerdo: 'Superior esquerdo',
  superior_direito: 'Superior direito',
  inferior_esquerdo: 'Inferior esquerdo',
  inferior_direito: 'Inferior direito',
  no_html: 'Personalizado (no HTML)',
};

export const qrCodeTipoConfigSchema = z.object({
  posicao: posicaoQrCodeSchema,
  tamanho: z.number().min(48).max(160),
});

export type QrCodeTipoConfig = z.infer<typeof qrCodeTipoConfigSchema>;

export const qrCodeMapaSchema = z.object({
  separacao: qrCodeTipoConfigSchema,
  conferencia: qrCodeTipoConfigSchema,
  carregamento: qrCodeTipoConfigSchema,
});

export type QrCodeMapa = z.infer<typeof qrCodeMapaSchema>;

export const classificarPorConferenciaSchema = z.enum(['pickway', 'sku']);

export type ClassificarPorConferencia = z.infer<
  typeof classificarPorConferenciaSchema
>;

export const CLASSIFICAR_POR_CONFERENCIA_LABELS: Record<
  ClassificarPorConferencia,
  string
> = {
  pickway: 'Pickway',
  sku: 'SKU',
};

export const agrupamentoConferenciaSchema = z.enum([
  'replicar_separacao',
  'apenas_transporte',
]);

export type AgrupamentoConferencia = z.infer<typeof agrupamentoConferenciaSchema>;

export const AGRUPAMENTO_CONFERENCIA_LABELS: Record<
  AgrupamentoConferencia,
  string
> = {
  replicar_separacao: 'Replicar agrupamento de separação',
  apenas_transporte: 'Agrupar apenas por transporte',
};

export const opcoesConferenciaSchema = z.object({
  classificarPor: classificarPorConferenciaSchema,
  agrupamento: agrupamentoConferenciaSchema,
});

export type OpcoesConferencia = z.infer<typeof opcoesConferenciaSchema>;

export const tipoDadosBasicosSchema = z.enum(['cliente', 'transporte']);

export type TipoDadosBasicos = z.infer<typeof tipoDadosBasicosSchema>;

export const TIPO_DADOS_BASICOS_LABELS: Record<TipoDadosBasicos, string> = {
  cliente: 'Cliente',
  transporte: 'Transporte',
};

export const impressaoConfigSchema = z.object({
  centroId: z.string(),
  centroNome: z.string(),
  tipoDadosBasicos: tipoDadosBasicosSchema,
  quebraPalete: quebraPaleteConfigSchema,
  opcoesSeparacao: opcoesSeparacaoSchema,
  opcoesConferencia: opcoesConferenciaSchema,
  ordemImpressaoSeparacao: z.array(ordemImpressaoItemSchema).min(1),
  ordemImpressaoConferencia: z.array(ordemImpressaoItemSchema).min(1),
  layoutCabecalho: layoutCabecalhoSchema,
  qrCodeMapa: qrCodeMapaSchema,
  opcoesTabelasCarregamento: opcoesTabelasCarregamentoSchema,
  nomeCentroSistema: z.string(),
  usuarioId: z.string(),
});

export type ImpressaoConfig = z.infer<typeof impressaoConfigSchema>;

export const impressaoConfigConteudoSchema = impressaoConfigSchema.omit({
  centroId: true,
  centroNome: true,
  nomeCentroSistema: true,
  usuarioId: true,
});

export type ImpressaoConfigConteudo = z.infer<typeof impressaoConfigConteudoSchema>;

export type PreConfiguracaoImpressao = {
  id: string;
  nome: string;
  config: ImpressaoConfigConteudo;
  criadoEm: string;
  isPadrao?: boolean;
};
