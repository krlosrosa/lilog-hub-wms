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

export const checklistConditionsSchema = z.object({
  limpeza: z.boolean(),
  odor: z.boolean(),
  estrutura: z.boolean(),
  vedacao: z.boolean(),
});

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

const pesoField = z
  .string()
  .min(1, 'Informe o peso')
  .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Peso inválido');

export const detalheItemSchema = z.object({
  recebidaCaixa: numericField('Informe a recebida caixa'),
  recebidaUnidade: numericField('Informe a recebida unidade'),
  peso: pesoField,
  lote: z.string().min(1, 'Informe o lote'),
  idPalete: z.string().optional(),
});

export type DetalheItemForm = z.infer<typeof detalheItemSchema>;

export const loteConferidoSchema = z.object({
  id: z.string(),
  lote: z.string(),
  idPalete: z.string(),
  recebidaCaixa: z.number(),
  recebidaUnidade: z.number(),
  peso: z.number(),
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

export const avariaSchema = z
  .object({
    quantidadeCaixa: avariaQuantidadeInt,
    quantidadeUnidade: avariaQuantidadeInt,
    tipo: z.string().min(1, 'Selecione o tipo'),
    natureza: z.string().min(1, 'Selecione a natureza'),
    causa: z.string().min(1, 'Selecione a causa'),
    replicarParaTodosConferidos: z.boolean().optional(),
  })
  .refine((data) => data.quantidadeCaixa > 0 || data.quantidadeUnidade > 0, {
    message: 'Informe caixa e/ou unidade avariada',
    path: ['quantidadeCaixa'],
  });

export type AvariaForm = z.infer<typeof avariaSchema>;

export const avariaRegistroSchema = z.object({
  id: z.string(),
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

export const skuItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  status: skuItemStatusSchema,
  hasAvaria: z.boolean().optional(),
  hasDivergencia: z.boolean().optional(),
  isReentrega: z.boolean().optional(),
  quantidadeEsperada: z.number().int().nonnegative().optional(),
});

export type SkuItem = z.infer<typeof skuItemSchema>;
