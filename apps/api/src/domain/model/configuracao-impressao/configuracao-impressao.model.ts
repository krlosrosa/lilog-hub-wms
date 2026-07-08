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
  conferencia_reentrega: QrCodeTipoConfigSchema,
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
  ordemImpressaoConferenciaReentrega: z.array(OrdemImpressaoItemSchema).min(1),
  qrCodeMapa: QrCodeMapaSchema,
  opcoesTabelasCarregamento: OpcoesTabelasCarregamentoSchema,
});

export type ConfiguracaoImpressaoConteudo = z.infer<
  typeof ConfiguracaoImpressaoConteudoSchema
>;

export const TemplatesHtmlSchema = z.object({
  separacao: z.string(),
  conferencia: z.string(),
  conferencia_reentrega: z.string(),
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

export const TEMPLATE_CONFERENCIA_REENTREGA_PADRAO = `<!-- Cabeçalho do Mapa de Conferência Reentrega -->
<div style="display:flex; justify-content:space-between; align-items:flex-start;">
  <div>
    <p style="font-size:10px; font-weight:bold; text-transform:uppercase; color:#B45309;">
      Conferência Reentrega
    </p>
    <strong style="font-size:14px;">{{rota}}</strong>
    <p style="margin:2px 0; font-size:11px;">{{todos_clientes}}</p>
  </div>
  <div style="text-align:right; font-size:11px; color:#555;">
    <p>Seq. {{sequencia}}</p>
    <p>Placa: {{placa}}</p>
    <p>{{empresa}}</p>
  </div>
</div>`;

const TIPOS_LAYOUT = [
  'separacao',
  'conferencia',
  'conferencia_reentrega',
  'carregamento',
] as const;

export type TipoLayoutMapa = (typeof TIPOS_LAYOUT)[number];

export function normalizarTemplatesHtml(
  templatesHtml: Partial<TemplatesHtml> & {
    separacao: string;
    conferencia: string;
    carregamento: string;
  },
): TemplatesHtml {
  return {
    separacao: templatesHtml.separacao,
    conferencia: templatesHtml.conferencia,
    carregamento: templatesHtml.carregamento,
    conferencia_reentrega:
      templatesHtml.conferencia_reentrega?.trim().length
        ? templatesHtml.conferencia_reentrega
        : TEMPLATE_CONFERENCIA_REENTREGA_PADRAO,
  };
}

export function normalizarConfiguracaoImpressao(
  configuracao: ConfiguracaoImpressaoConteudo,
): ConfiguracaoImpressaoConteudo {
  const ordemConferenciaReentrega =
    configuracao.ordemImpressaoConferenciaReentrega ??
    configuracao.ordemImpressaoConferencia;

  return {
    ...configuracao,
    ordemImpressaoConferenciaReentrega: ordemConferenciaReentrega,
    qrCodeMapa: {
      ...configuracao.qrCodeMapa,
      conferencia_reentrega:
        configuracao.qrCodeMapa.conferencia_reentrega ??
        configuracao.qrCodeMapa.conferencia,
    },
  };
}

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
  const configuracaoNormalizada = normalizarConfiguracaoImpressao(configuracao);
  const templatesNormalizados = normalizarTemplatesHtml(templatesHtml);

  if (
    !configuracaoNormalizada.opcoesSeparacao.separarPaletesCompletos &&
    !configuracaoNormalizada.opcoesSeparacao.separarUnidadesIndividuais &&
    !configuracaoNormalizada.opcoesSeparacao.segregarFifo
  ) {
    return 'Ative ao menos uma opção de separação.';
  }

  if (
    configuracaoNormalizada.opcoesSeparacao.segregarFifo &&
    configuracaoNormalizada.opcoesSeparacao.faixasFifo.length === 0
  ) {
    return 'Selecione ao menos uma faixa FIFO.';
  }

  for (const tipo of TIPOS_LAYOUT) {
    if (
      !qrCodeConfigurado(
        templatesNormalizados[tipo],
        configuracaoNormalizada.qrCodeMapa[tipo].posicao,
      )
    ) {
      const labels: Record<TipoLayoutMapa, string> = {
        separacao: 'Separação',
        conferencia: 'Conferência',
        conferencia_reentrega: 'Conferência Reentrega',
        carregamento: 'Carregamento',
      };

      return `QR Code obrigatório em ${labels[tipo]}: escolha uma posição fixa ou inclua {{qr_code}} no HTML.`;
    }
  }

  return null;
}
