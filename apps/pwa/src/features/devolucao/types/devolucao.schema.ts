import { z } from 'zod';

export const demandStatusSchema = z.enum(['aguardando', 'em_conferencia', 'concluido']);

export type DemandStatus = z.infer<typeof demandStatusSchema>;

export const demandTagVariantSchema = z.enum(['default', 'error']);

export const companyCodeSchema = z.enum(['ITB', 'DPA', 'LDB']);

export type CompanyCode = z.infer<typeof companyCodeSchema>;

export const demandSchema = z.object({
  id: z.string(),
  supplier: z.string(),
  dock: z.string(),
  arrival: z.string(),
  status: demandStatusSchema.default('aguardando'),
  companies: z.array(companyCodeSchema).min(1).max(3),
  isPriority: z.boolean().optional(),
  cargaSegregada: z.boolean().optional(),
  pulse: z.boolean().optional(),
  skuCount: z.number().int().nonnegative().optional(),
  routeId: z.string(),
  tagLabel: z.string().optional(),
  tagVariant: demandTagVariantSchema.optional(),
  paletesEsperados: z.number().int().nonnegative().optional(),
  paletesRecebidos: z.number().int().nonnegative().optional(),
});

export type Demand = z.infer<typeof demandSchema>;

export const checklistConditionsSchema = z.record(z.string(), z.boolean());

export type CondicaoChecklistItem = {
  id: string;
  label: string;
};

export const DEFAULT_CONDICOES_CHECKLIST: CondicaoChecklistItem[] = [
  { id: 'limpeza', label: 'Limpeza Interna' },
  { id: 'odor', label: 'Ausência de Odor' },
  { id: 'estrutura', label: 'Integridade Estrutural' },
  { id: 'vedacao', label: 'Vedação das Portas' },
];

export function buildDefaultChecklistConditions(
  condicoesChecklist: CondicaoChecklistItem[],
): Record<string, boolean> {
  return Object.fromEntries(condicoesChecklist.map((item) => [item.id, false]));
}

const paletesRecebidosField = z
  .string()
  .min(1, 'Informe a quantidade de paletes recebidos')
  .refine((value) => {
    const parsed = Number(value.trim());
    return Number.isInteger(parsed) && parsed >= 0;
  }, 'Quantidade inválida');

export const checklistSchema = z.object({
  dock: z.string().min(1, 'Selecione a doca'),
  paletesRecebidos: paletesRecebidosField,
  tempBau: z.coerce.number().optional(),
  tempProd: z.coerce.number().optional(),
  conditions: checklistConditionsSchema,
  observacoes: z.string().optional(),
});

export type ChecklistForm = z.infer<typeof checklistSchema>;

const numericField = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Valor inválido');

const optionalNumericField = z
  .string()
  .optional()
  .refine(
    (v) => v === undefined || v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0),
    'Valor inválido',
  );

const pesoField = z
  .string()
  .min(1, 'Informe o peso')
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Peso inválido');

const optionalPesoField = z
  .string()
  .optional()
  .refine(
    (v) =>
      v === undefined ||
      v === '' ||
      (!Number.isNaN(Number(v)) && Number(v) > 0),
    'Peso inválido',
  );

export const quantidadeModoSchema = z.enum(['caixa', 'unidade', 'ambos']);
export type QuantidadeModo = z.infer<typeof quantidadeModoSchema>;

export const loteModoSchema = z.enum(['lote', 'fabricacao', 'ambos']);
export type LoteModo = z.infer<typeof loteModoSchema>;

export const DEFAULT_PARAMETROS_DEVOLUCAO_CONFERENCIA = {
  quantidadeModo: 'ambos',
  loteModo: 'lote',
  controlaPalete: false,
  condicoesChecklist: DEFAULT_CONDICOES_CHECKLIST,
} as const satisfies {
  quantidadeModo: QuantidadeModo;
  loteModo: LoteModo;
  controlaPalete: boolean;
  condicoesChecklist: CondicaoChecklistItem[];
};

export type ParametrosDevolucaoConferencia = {
  quantidadeModo: QuantidadeModo;
  loteModo: LoteModo;
  controlaPalete: boolean;
  condicoesChecklist: CondicaoChecklistItem[];
};

type BuildDetalheItemSchemaOptions = {
  pesoVariavel: boolean;
  quantidadeModo: QuantidadeModo;
  loteModo: LoteModo;
  controlaPalete: boolean;
};

export function buildDetalheItemSchema({
  pesoVariavel,
  quantidadeModo,
  loteModo,
  controlaPalete,
}: BuildDetalheItemSchemaOptions) {
  const caixaField =
    quantidadeModo === 'unidade'
      ? optionalNumericField
      : numericField('Informe a recebida caixa');

  const unidadeField =
    quantidadeModo === 'caixa'
      ? optionalNumericField
      : numericField('Informe a recebida unidade');

  const loteField =
    loteModo === 'fabricacao'
      ? z.string().optional()
      : z.string().min(1, 'Informe o lote');

  const dataFabricacaoField =
    loteModo === 'lote'
      ? z.string().optional()
      : z.string().min(1, 'Informe a data de fabricação');

  const idPaleteField = controlaPalete
    ? z.string().min(1, 'Informe o ID do palete / WMS')
    : z.string().optional();

  return z.object({
    recebidaCaixa: caixaField,
    recebidaUnidade: unidadeField,
    peso: pesoVariavel ? pesoField : optionalPesoField,
    lote: loteField,
    dataFabricacao: dataFabricacaoField,
    idPalete: idPaleteField,
  });
}

export type DetalheItemForm = z.infer<ReturnType<typeof buildDetalheItemSchema>>;

/** @deprecated Use buildDetalheItemSchema() */
export const detalheItemSchema = buildDetalheItemSchema({
  pesoVariavel: true,
  quantidadeModo: 'ambos',
  loteModo: 'lote',
  controlaPalete: false,
});

export const loteConferidoSchema = z.object({
  id: z.string(),
  lote: z.string(),
  dataFabricacao: z.string().optional(),
  idPalete: z.string(),
  recebidaCaixa: z.number(),
  recebidaUnidade: z.number(),
  peso: z.number().optional(),
});

export type LoteConferido = z.infer<typeof loteConferidoSchema>;

export const avariaTipoSchema = z.enum([
  'fisica',
  'embalagem',
  'qualidade',
  'documental',
]);

export type AvariaTipo = z.infer<typeof avariaTipoSchema>;

export const avariaNaturezaSchema = z.enum([
  'parcial',
  'total',
  'superficial',
  'irreversivel',
]);

export type AvariaNatureza = z.infer<typeof avariaNaturezaSchema>;

export const avariaCausaSchema = z.enum([
  'transporte',
  'manuseio',
  'armazenamento',
  'fornecedor',
  'indeterminada',
]);

export type AvariaCausa = z.infer<typeof avariaCausaSchema>;

const avariaQuantidadeInt = z.coerce
  .number()
  .int('Use um número inteiro')
  .min(0, 'Valor inválido');

export function buildAvariaSchema(quantidadeModo: QuantidadeModo) {
  const base = z.object({
    quantidadeCaixa: avariaQuantidadeInt,
    quantidadeUnidade: avariaQuantidadeInt,
    tipo: z.string().min(1, 'Selecione o tipo'),
    natureza: z.string().min(1, 'Selecione a natureza'),
    causa: z.string().min(1, 'Selecione a causa'),
    replicarParaTodosConferidos: z.boolean().optional(),
  });

  if (quantidadeModo === 'caixa') {
    return base.refine((data) => data.quantidadeCaixa > 0, {
      message: 'Informe a quantidade avariada em caixas',
      path: ['quantidadeCaixa'],
    });
  }

  if (quantidadeModo === 'unidade') {
    return base.refine((data) => data.quantidadeUnidade > 0, {
      message: 'Informe a quantidade avariada em unidades',
      path: ['quantidadeUnidade'],
    });
  }

  return base.refine((data) => data.quantidadeCaixa > 0 || data.quantidadeUnidade > 0, {
    message: 'Informe caixa e/ou unidade avariada',
    path: ['quantidadeCaixa'],
  });
}

/** @deprecated Use buildAvariaSchema() */
export const avariaSchema = buildAvariaSchema('ambos');

export type AvariaForm = z.infer<ReturnType<typeof buildAvariaSchema>>;

export const avariaRegistroSchema = z.object({
  id: z.string(),
  sku: z.string().optional(),
  skusAfetados: z.array(z.string()).optional(),
  quantidadeCaixa: z.number(),
  quantidadeUnidade: z.number(),
  tipo: z.string(),
  natureza: z.string(),
  causa: z.string(),
  photoCount: z.number(),
  replicado: z.boolean().optional(),
});

export type AvariaRegistro = z.infer<typeof avariaRegistroSchema>;

export const skuItemStatusSchema = z.enum(['pendente', 'conferido']);

export type SkuItemStatus = z.infer<typeof skuItemStatusSchema>;

export const skuItemFilterSchema = z.enum([
  'conferido',
  'pendente',
  'avaria',
  'divergencia',
  'reentrega',
]);

export type SkuItemFilter = z.infer<typeof skuItemFilterSchema>;

export const devolucaoItemCondicaoApiSchema = z.enum([
  'integro',
  'avariado',
  'vencido',
  'violado',
  'nao_identificado',
]);

export type DevolucaoItemCondicaoApi = z.infer<
  typeof devolucaoItemCondicaoApiSchema
>;

export const skuItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  status: skuItemStatusSchema,
  itemId: z.string().optional(),
  nfNumero: z.string().optional(),
  qtdEsperada: z.number().nonnegative().optional(),
  qtdConferida: z.number().nullable().optional(),
  condicao: devolucaoItemCondicaoApiSchema.optional(),
  hasAvaria: z.boolean().optional(),
  hasDivergencia: z.boolean().optional(),
  isReentrega: z.boolean().optional(),
  quantidadeEsperada: z.number().int().nonnegative().optional(),
  pesoVariavel: z.boolean().optional(),
});

export type SkuItem = z.infer<typeof skuItemSchema>;

export type DemandaDevolucaoStatusApi =
  | 'rascunho'
  | 'aberta'
  | 'em_analise'
  | 'em_execucao'
  | 'conferida'
  | 'concluida'
  | 'cancelada';

export type DevolucaoNotaFiscalTipoApi =
  | 'reentrega'
  | 'devolucao_parcial'
  | 'devolucao_total';

export type DevolucaoItemApi = {
  id: string;
  produtoId: string | null;
  sku: string;
  descricaoProduto: string | null;
  lote: string | null;
  dataFabricacao: string | null;
  quantidade: number;
  qtdConferida: number | null;
  unidadeMedida: string;
  quantidadeNormalizadaUnidades: number;
  pesoDevolvido: number | null;
  motivoItem: string | null;
  condicao: DevolucaoItemCondicaoApi;
  observacao: string | null;
  createdAt: string;
  pesoVariavel: boolean;
};

export type DevolucaoNfApi = {
  id: string;
  numeroNf: string;
  chaveAcesso: string | null;
  tipo: DevolucaoNotaFiscalTipoApi;
  motivo: string;
  cliente: string | null;
  codCliente: string | null;
  transporteId: string | null;
  observacao: string | null;
  createdAt: string;
  itens: DevolucaoItemApi[];
};

export type DemandaDetalheCache = {
  id: string;
  codigoDemanda: string;
  status: DemandaDevolucaoStatusApi;
  unidadeId: string;
  observacao: string | null;
  placa: string | null;
  cliente: string | null;
  transporteId: string | null;
  tiposNf: DevolucaoNotaFiscalTipoApi[];
  totalNfs: number;
  totalItens: number;
  pesoDevolvido: number;
  notasFiscais: DevolucaoNfApi[];
  faltasPeso?: DevolucaoFaltaPesoCache[];
  updatedAt: string;
  cachedAt: number;
};

export type DevolucaoFaltaPesoCache = {
  id: string;
  itemId: string;
  sku: string;
  quantidadeContabilConsiderada: number;
  zerarQuantidadeContabil: boolean;
  status: 'pendente' | 'validada' | 'rejeitada';
};

export type DevolucaoConferenciaRascunhoEntry = {
  demandId: string;
  itemId: string;
  sku: string;
  lotes: LoteConferido[];
  qtdConferidaTotal: number;
  condicao?: DevolucaoItemCondicaoApi;
  updatedAt: number;
};
