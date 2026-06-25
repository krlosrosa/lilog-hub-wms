import { z } from 'zod';

export const tarefaStatusSchema = z.enum(['pendente', 'em_andamento', 'express']);

export type TarefaStatus = z.infer<typeof tarefaStatusSchema>;

export const tarefaTabSchema = z.enum(['pendentes', 'em_andamento']);

export type TarefaTab = z.infer<typeof tarefaTabSchema>;

export const tarefaPrioridadeSchema = z.enum([
  'alto_valor',
  'padrao',
  'express',
  'despacho_imediato',
]);

export type TarefaPrioridade = z.infer<typeof tarefaPrioridadeSchema>;

export const tarefaSchema = z.object({
  id: z.string(),
  pedidoId: z.string(),
  zona: z.string(),
  totalSkus: z.number().int().positive(),
  pesoTotalKg: z.number().optional(),
  status: tarefaStatusSchema,
  prioridade: tarefaPrioridadeSchema,
  descricao: z.string(),
  tituloJornada: z.string().optional(),
});

export type Tarefa = z.infer<typeof tarefaSchema>;

export const pickingItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  nome: z.string(),
  lote: z.string(),
  unidade: z.string(),
  quantidadeRestante: z.number().int().nonnegative(),
});

export type PickingItem = z.infer<typeof pickingItemSchema>;

export const etiquetaSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  sku: z.string(),
  nome: z.string(),
  lote: z.string(),
  unidade: z.string(),
});

export type Etiqueta = z.infer<typeof etiquetaSchema>;

export const caixaRegistradaSchema = z.object({
  etiquetaId: z.string(),
  etiquetaCodigo: z.string(),
  sku: z.string(),
  nome: z.string(),
  lote: z.string(),
  pesoKg: z.number().positive(),
});

export type CaixaRegistrada = z.infer<typeof caixaRegistradaSchema>;

export const cadastroPickingSchema = z.object({
  pesoCaixaAtual: z
    .string()
    .min(1, 'Informe o peso desta caixa')
    .refine((v) => {
      const n = Number(v.replace(',', '.'));
      return !Number.isNaN(n) && n > 0;
    }, 'Informe o peso desta caixa'),
});

export type CadastroPickingForm = z.infer<typeof cadastroPickingSchema>;

export const skuResumoStatusSchema = z.enum(['correspondido', 'divergente']);

export type SkuResumoStatus = z.infer<typeof skuResumoStatusSchema>;

export const skuResumoItemSchema = z.object({
  id: z.string(),
  sku: z.string(),
  descricao: z.string(),
  separado: z.number(),
  esperado: z.number(),
  status: skuResumoStatusSchema,
});

export type SkuResumoItem = z.infer<typeof skuResumoItemSchema>;

export const resumoPickingSchema = z.object({
  tarefaId: z.string(),
  loteId: z.string(),
  zona: z.string(),
  totalCaixas: z.number().int().nonnegative(),
  pesoTotalKg: z.number(),
  divergencias: z.number().int().nonnegative(),
  operador: z.string(),
  turno: z.string(),
  skus: z.array(skuResumoItemSchema),
});

export type ResumoPicking = z.infer<typeof resumoPickingSchema>;
