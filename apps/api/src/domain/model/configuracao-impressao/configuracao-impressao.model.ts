import { z } from 'zod';

import { OpcoesTabelasCarregamentoSchema } from '@lilog/contracts';

export const TipoQuebraSchema = z.enum(['porcentual', 'quantidade', 'linhas']);

export const QuebraPaleteConfigSchema = z.object({
  ativa: z.boolean(),
  tipo: TipoQuebraSchema,
  percentual: z.number().min(0).max(100),
});

export const FaixaFifoSchema = z.enum(['amarelo', 'laranja', 'vermelho']);

export const OpcoesSeparacaoSchema = z.object({
  separarPaletesCompletos: z.boolean(),
  separarUnidadesIndividuais: z.boolean(),
  segregarFifo: z.boolean(),
  faixasFifo: z.array(FaixaFifoSchema),
  percentualMaximoDataFifo: z.number().min(0).max(100),
});

export const OrdemImpressaoItemSchema = z.enum([
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

export const PosicaoQrCodeSchema = z.enum([
  'superior_esquerdo',
  'superior_direito',
  'inferior_esquerdo',
  'inferior_direito',
  'no_html',
]);

export const QrCodeTipoConfigSchema = z.object({
  posicao: PosicaoQrCodeSchema,
  tamanho: z.number().min(48).max(160),
});

export const QrCodeMapaSchema = z.object({
  separacao: QrCodeTipoConfigSchema,
  conferencia: QrCodeTipoConfigSchema,
  carregamento: QrCodeTipoConfigSchema,
});

export const ClassificarPorConferenciaSchema = z.enum(['pickway', 'sku']);

export const AgrupamentoConferenciaSchema = z.enum([
  'replicar_separacao',
  'apenas_transporte',
]);

export const OpcoesConferenciaSchema = z.object({
  classificarPor: ClassificarPorConferenciaSchema,
  agrupamento: AgrupamentoConferenciaSchema,
});

export const TipoDadosBasicosSchema = z.enum(['cliente', 'transporte']);

export const ConfiguracaoImpressaoConteudoSchema = z.object({
  tipoDadosBasicos: TipoDadosBasicosSchema,
  quebraPalete: QuebraPaleteConfigSchema,
  opcoesSeparacao: OpcoesSeparacaoSchema,
  opcoesConferencia: OpcoesConferenciaSchema,
  ordemImpressaoSeparacao: z.array(OrdemImpressaoItemSchema).min(1),
  ordemImpressaoConferencia: z.array(OrdemImpressaoItemSchema).min(1),
  qrCodeMapa: QrCodeMapaSchema,
  opcoesTabelasCarregamento: OpcoesTabelasCarregamentoSchema,
});

export type ConfiguracaoImpressaoConteudo = z.infer<
  typeof ConfiguracaoImpressaoConteudoSchema
>;

export const TemplatesHtmlSchema = z.object({
  separacao: z.string(),
  conferencia: z.string(),
  carregamento: z.string(),
});

export type TemplatesHtml = z.infer<typeof TemplatesHtmlSchema>;

export const CreateConfiguracaoImpressaoInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  nome: z.string().min(1).max(120),
  configuracao: ConfiguracaoImpressaoConteudoSchema,
  templatesHtml: TemplatesHtmlSchema,
  isPadrao: z.boolean().optional().default(false),
  criadoPor: z.number().int().positive().optional(),
});

export type CreateConfiguracaoImpressaoInput = z.infer<
  typeof CreateConfiguracaoImpressaoInputSchema
>;

export const UpdateConfiguracaoImpressaoInputSchema = z.object({
  nome: z.string().min(1).max(120).optional(),
  configuracao: ConfiguracaoImpressaoConteudoSchema.optional(),
  templatesHtml: TemplatesHtmlSchema.optional(),
  isPadrao: z.boolean().optional(),
});

export type UpdateConfiguracaoImpressaoInput = z.infer<
  typeof UpdateConfiguracaoImpressaoInputSchema
>;

export const QR_CODE_VARIAVEL = '{{qr_code}}';

const TIPOS_LAYOUT = ['separacao', 'conferencia', 'carregamento'] as const;

export function qrCodeConfigurado(
  templateHtml: string,
  posicao: z.infer<typeof PosicaoQrCodeSchema>,
): boolean {
  if (posicao !== 'no_html') {
    return true;
  }

  return templateHtml.includes(QR_CODE_VARIAVEL);
}

export function validarConfiguracaoImpressao(
  configuracao: ConfiguracaoImpressaoConteudo,
  templatesHtml: TemplatesHtml,
): string | null {
  if (
    !configuracao.opcoesSeparacao.separarPaletesCompletos &&
    !configuracao.opcoesSeparacao.separarUnidadesIndividuais &&
    !configuracao.opcoesSeparacao.segregarFifo
  ) {
    return 'Ative ao menos uma opção de separação.';
  }

  if (
    configuracao.opcoesSeparacao.segregarFifo &&
    configuracao.opcoesSeparacao.faixasFifo.length === 0
  ) {
    return 'Selecione ao menos uma faixa FIFO.';
  }

  for (const tipo of TIPOS_LAYOUT) {
    if (
      !qrCodeConfigurado(templatesHtml[tipo], configuracao.qrCodeMapa[tipo].posicao)
    ) {
      return `QR Code obrigatório em ${tipo}: escolha uma posição fixa ou inclua {{qr_code}} no HTML.`;
    }
  }

  return null;
}
