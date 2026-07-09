import { z } from 'zod';

export const demandStatusSchema = z.enum([
  'agendado',
  'aguardando',
  'liberado_para_conferencia',
  'em_conferencia',
  'conferido',
  'finalizado',
]);

export type DemandStatus = z.infer<typeof demandStatusSchema>;

export const demandTagVariantSchema = z.enum(['default', 'error']);

export const companyCodeSchema = z.enum(['ITB', 'DPA', 'LDB']);

export type CompanyCode = z.infer<typeof companyCodeSchema>;

export const demandSchema = z.object({
  id: z.string(),
  supplier: z.string(),
  dock: z.string(),
  arrival: z.string(),
  status: demandStatusSchema.default('liberado_para_conferencia'),
  statusLabel: z.string().optional(),
  companies: z.array(companyCodeSchema).min(1).max(3),
  isPriority: z.boolean().optional(),
  pulse: z.boolean().optional(),
  skuCount: z.number().int().nonnegative().optional(),
  routeId: z.string(),
  tagLabel: z.string().optional(),
  tagVariant: demandTagVariantSchema.optional(),
  recebimentoId: z.string().optional(),
  unidadeId: z.string().optional(),
  preRecebimentoSituacao: z.string().optional(),
  pendingOfflineSync: z.boolean().optional(),
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

export const checklistSchema = z.object({
  dock: z.string().min(1, 'Selecione a doca'),
  lacre: z.string().min(1, 'Informe o número do lacre'),
  tempBau: z.coerce.number().optional(),
  tempProd: z.coerce.number().optional(),
  conditions: checklistConditionsSchema,
  observacoes: z.string().optional(),
});

export type ChecklistForm = z.infer<typeof checklistSchema>;

export type ProdutoConferenciaConfigForm = {
  controlaLote: boolean;
  controlaValidade: boolean;
  controlaPeso: boolean;
  pesoVariavel: boolean;
  exigirEtiquetaPesoVariavel: boolean;
  controlaNumeroSerie: boolean;
};

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

const pesoField = (required: boolean) => {
  const base = required ? z.string().min(1, 'Informe o peso') : z.string();
  return base.refine(
    (v) =>
      !required ||
      (v !== '' && !Number.isNaN(Number(v)) && Number(v) > 0),
    'Peso inválido',
  );
};

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

export const DEFAULT_PARAMETROS_RECEBIMENTO_CONFERENCIA = {
  quantidadeModo: 'ambos',
  loteModo: 'lote',
  controlaPalete: false,
  solicitarPesoPvar: true,
  exigirEtiquetaPesoVariavel: false,
  condicoesChecklist: DEFAULT_CONDICOES_CHECKLIST,
} as const satisfies {
  quantidadeModo: QuantidadeModo;
  loteModo: LoteModo;
  controlaPalete: boolean;
  solicitarPesoPvar: boolean;
  exigirEtiquetaPesoVariavel: boolean;
  condicoesChecklist: CondicaoChecklistItem[];
};

export type ParametrosRecebimentoConferencia = {
  quantidadeModo: QuantidadeModo;
  loteModo: LoteModo;
  controlaPalete: boolean;
  solicitarPesoPvar: boolean;
  exigirEtiquetaPesoVariavel: boolean;
  condicoesChecklist: CondicaoChecklistItem[];
};

type BuildDetalheItemSchemaOptions = {
  pesoVariavel: boolean;
  exigirEtiquetaPesoVariavel: boolean;
  quantidadeModo: QuantidadeModo;
  loteModo: LoteModo;
  controlaPalete: boolean;
};

export function buildDetalheItemSchema({
  pesoVariavel,
  exigirEtiquetaPesoVariavel,
  quantidadeModo,
  loteModo,
  controlaPalete,
}: BuildDetalheItemSchemaOptions) {
  const caixaField =
    pesoVariavel || quantidadeModo === 'unidade'
      ? optionalNumericField
      : numericField('Informe a recebida caixa');

  const unidadeField =
    pesoVariavel || quantidadeModo === 'caixa'
      ? optionalNumericField
      : numericField('Informe a recebida unidade');

  const loteField = pesoVariavel
    ? z.string().optional()
    : loteModo === 'fabricacao'
      ? z.string().optional()
      : z
          .string()
          .min(1, 'Informe o lote')
          .regex(/^\d+$/, 'Lote deve conter apenas números');

  const validadeField =
    pesoVariavel || loteModo === 'lote'
      ? z.string().optional()
      : z.string().min(1, 'Informe a fabricação');

  const idPaleteField = controlaPalete
    ? z.string().min(1, 'Informe o ID do palete')
    : z.string().optional();

  const etiquetaField =
    pesoVariavel && exigirEtiquetaPesoVariavel
      ? z.string().min(1, 'Informe ou escaneie a etiqueta da caixa')
      : z.string().optional();

  return z.object({
    sku: z.string().min(1, 'Escaneie ou digite o SKU'),
    idPalete: idPaleteField,
    lote: loteField,
    recebidaCaixa: caixaField,
    recebidaUnidade: unidadeField,
    peso: pesoVariavel ? pesoField(true) : optionalPesoField,
    etiqueta: etiquetaField,
    validade: validadeField,
  });
}

/** @deprecated Use buildDetalheItemSchema() */
export function createDetalheItemSchema(config: ProdutoConferenciaConfigForm) {
  return buildDetalheItemSchema({
    pesoVariavel: config.pesoVariavel,
    exigirEtiquetaPesoVariavel: config.exigirEtiquetaPesoVariavel,
    quantidadeModo: 'ambos',
    loteModo: 'lote',
    controlaPalete: true,
  });
}

export const detalheItemSchema = buildDetalheItemSchema({
  pesoVariavel: true,
  exigirEtiquetaPesoVariavel: false,
  quantidadeModo: 'ambos',
  loteModo: 'lote',
  controlaPalete: true,
});

export type DetalheItemForm = z.infer<ReturnType<typeof buildDetalheItemSchema>>;

export const loteConferidoSchema = z.object({
  id: z.string(),
  lote: z.string(),
  idPalete: z.string(),
  recebidaCaixa: z.number(),
  recebidaUnidade: z.number(),
  peso: z.number().optional(),
  etiquetaCodigo: z.string().optional(),
  pesagemId: z.string().optional(),
  validade: z.string().optional(),
  itemRecebimentoId: z.string().optional(),
  unitizadorId: z.string().optional(),
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
    lote: z.string().optional(),
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
  produtoId: z.string().optional(),
  sku: z.string().optional(),
  lote: z.string().optional(),
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
]);

export type SkuItemFilter = z.infer<typeof skuItemFilterSchema>;

export const skuItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  status: skuItemStatusSchema,
  hasAvaria: z.boolean().optional(),
  hasDivergencia: z.boolean().optional(),
  qtdEsperada: z.number().nonnegative().optional(),
  qtdConferida: z.number().nonnegative().optional(),
  quantidadeEsperada: z.number().nonnegative().optional(),
});

export type SkuItem = z.infer<typeof skuItemSchema>;
