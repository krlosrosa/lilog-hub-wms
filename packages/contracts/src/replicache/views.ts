import { z } from 'zod';

export const DemandViewSchema = z.object({
  preRecebimentoId: z.string(),
  recebimentoId: z.string().nullable(),
  unidadeId: z.string(),
  placa: z.string().nullable(),
  transportadoraNome: z.string().nullable(),
  situacao: z.string(),
  dock: z.string().nullable(),
  skuCount: z.number().int().nonnegative(),
  horarioPrevisto: z.string(),
  conferenteId: z.number().nullable(),
  conferente: z.string().nullable(),
  conferenteMatricula: z.string().nullable(),
  alocacaoFuncionarioId: z.number().nullable(),
  atribuidoAMim: z.boolean().optional(),
});

export type DemandView = z.infer<typeof DemandViewSchema>;

export const ItemConferidoViewSchema = z.object({
  id: z.string(),
  recebimentoId: z.string().nullable(),
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  quantidadeRecebida: z.number(),
  unidadeMedida: z.string(),
  loteRecebido: z.string().nullable(),
  validade: z.string().nullable(),
  pesoRecebido: z.number().nullable(),
  etiquetaCodigo: z.string().nullable(),
  pesagemId: z.string().nullable(),
  recebimentoItemId: z.string(),
  unitizadorCodigo: z.string().nullable(),
});

export type ItemConferidoView = z.infer<typeof ItemConferidoViewSchema>;

export const ProdutoConferenciaConfigViewSchema = z.object({
  controlaLote: z.boolean(),
  controlaValidade: z.boolean(),
  controlaPeso: z.boolean(),
  pesoVariavel: z.boolean(),
  exigirEtiquetaPesoVariavel: z.boolean(),
  controlaNumeroSerie: z.boolean(),
});

export type ProdutoConferenciaConfigView = z.infer<
  typeof ProdutoConferenciaConfigViewSchema
>;

export const ExpectedItemViewSchema = z.object({
  preRecebimentoId: z.string(),
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  unidadeMedida: z.string(),
  unidadesPorCaixa: z.number().int().positive(),
  quantidadeEsperada: z.number().nonnegative(),
  config: ProdutoConferenciaConfigViewSchema,
  isNovo: z.boolean().optional(),
});

export type ExpectedItemView = z.infer<typeof ExpectedItemViewSchema>;

export const ParametrosConferenciaViewSchema = z.object({
  quantidadeModo: z.enum(['caixa', 'unidade', 'ambos']),
  loteModo: z.enum(['lote', 'fabricacao', 'ambos']),
  controlaPalete: z.boolean(),
  solicitarPesoPvar: z.boolean(),
  exigirEtiquetaPesoVariavel: z.boolean(),
});

export type ParametrosConferenciaView = z.infer<
  typeof ParametrosConferenciaViewSchema
>;

export const ChecklistConditionsViewSchema = z.object({
  limpeza: z.boolean(),
  odor: z.boolean(),
  estrutura: z.boolean(),
  vedacao: z.boolean(),
});

export type ChecklistConditionsView = z.infer<
  typeof ChecklistConditionsViewSchema
>;

export const ChecklistViewSchema = z.object({
  preRecebimentoId: z.string(),
  recebimentoId: z.string().nullable(),
  dock: z.string().nullable(),
  lacre: z.string(),
  tempBau: z.number().nullable(),
  conditions: ChecklistConditionsViewSchema,
  observacoes: z.string().nullable(),
  photoCount: z.number().int().nonnegative(),
  savedAt: z.string().nullable(),
});

export type ChecklistView = z.infer<typeof ChecklistViewSchema>;

export const TemperaturaBauEtapaSchema = z.enum(['inicio', 'meio', 'fim']);

export type TemperaturaBauEtapa = z.infer<typeof TemperaturaBauEtapaSchema>;

export const TemperaturaBauViewSchema = z.object({
  recebimentoId: z.string().nullable(),
  etapa: TemperaturaBauEtapaSchema,
  temperatura: z.number(),
  medidoEm: z.string().nullable(),
});

export type TemperaturaBauView = z.infer<typeof TemperaturaBauViewSchema>;

export const AvariaViewSchema = z.object({
  id: z.string(),
  recebimentoId: z.string().nullable(),
  produtoId: z.string().nullable(),
  sku: z.string().nullable(),
  descricao: z.string(),
  tipo: z.string(),
  natureza: z.string(),
  causa: z.string(),
  quantidadeCaixas: z.number().int().nonnegative(),
  quantidadeUnidades: z.number().int().nonnegative(),
  lote: z.string().nullable(),
  validade: z.string().nullable(),
  numeroSerie: z.string().nullable(),
  photoCount: z.number().int().nonnegative(),
  replicado: z.boolean(),
  clientDamageId: z.string().nullable(),
  createdAt: z.string(),
});

export type AvariaView = z.infer<typeof AvariaViewSchema>;
