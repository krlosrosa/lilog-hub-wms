import { z } from 'zod';

export const recuperacaoDemandaStatusSchema = z.enum([
  'pendente',
  'em_execucao',
  'finalizada',
]);

export type RecuperacaoDemandaStatus = z.infer<
  typeof recuperacaoDemandaStatusSchema
>;

export const recuperacaoPrioridadeSchema = z.enum(['alta', 'media', 'baixa']);

export type RecuperacaoPrioridade = z.infer<typeof recuperacaoPrioridadeSchema>;

export const recuperacaoItemStatusSchema = z.enum([
  'pendente',
  'em_execucao',
  'concluido',
]);

export type RecuperacaoItemStatus = z.infer<typeof recuperacaoItemStatusSchema>;

export const recuperacaoDemandaFilterSchema = z.enum([
  'pendente',
  'em_execucao',
  'finalizada',
]);

export type RecuperacaoDemandaFilter = z.infer<
  typeof recuperacaoDemandaFilterSchema
>;

export const recuperacaoFotoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  label: z.string(),
});

export type RecuperacaoFoto = z.infer<typeof recuperacaoFotoSchema>;

export const recuperacaoDemandaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  status: recuperacaoDemandaStatusSchema,
  prioridade: recuperacaoPrioridadeSchema,
  motivoAvaria: z.string(),
  localizacao: z.string(),
  quantidadeTotal: z.number().int().positive(),
  dataAbertura: z.string(),
  progressoPercent: z.number().min(0).max(100).optional(),
  operador: z.string().optional(),
  totalSkus: z.number().int().positive(),
});

export type RecuperacaoDemanda = z.infer<typeof recuperacaoDemandaSchema>;

export const recuperacaoItemSchema = z.object({
  id: z.string(),
  demandaId: z.string(),
  sku: z.string(),
  nome: z.string(),
  quantidadeRecuperar: z.number().int().positive(),
  motivoAvaria: z.string(),
  lote: z.string().optional(),
  validade: z.string().optional(),
  temperatura: z.string().optional(),
  descricaoAvaria: z.string().optional(),
  fotosAntes: z.array(recuperacaoFotoSchema).default([]),
  status: recuperacaoItemStatusSchema,
  instrucaoTrabalho: z.string(),
  enderecoEsperado: z.string(),
});

export type RecuperacaoItem = z.infer<typeof recuperacaoItemSchema>;

export const recuperacaoExecucaoFormSchema = z.object({
  qtyAvariada: z.coerce
    .number()
    .int()
    .min(1, 'Informe a qtd avariada'),
  qtyRecuperada: z.coerce
    .number()
    .int()
    .min(0, 'Quantidade inválida'),
  observacao: z.string().max(500).optional().default(''),
});

export type RecuperacaoExecucaoForm = z.infer<
  typeof recuperacaoExecucaoFormSchema
>;

export const recuperacaoExecucaoRegistroSchema = z.object({
  itemId: z.string(),
  demandaId: z.string(),
  qtyAvariada: z.number().int().min(1),
  qtyRecuperada: z.number().int().min(0),
  observacao: z.string().optional(),
  fotoDepoisUrl: z.string().optional(),
  finalizadoEm: z.string(),
});

export type RecuperacaoExecucaoRegistro = z.infer<
  typeof recuperacaoExecucaoRegistroSchema
>;

export const recuperacaoResumoSchema = z.object({
  demandaId: z.string(),
  totalSkus: z.number().int().min(0),
  totalUnidades: z.number().int().min(0),
  totalRecuperado: z.number().int().min(0),
  eficienciaPercent: z.number().min(0).max(100),
  tempoGastoMinutos: z.number().int().min(0),
  fotoAntesUrl: z.string().url().optional(),
  fotoDepoisUrl: z.string().url().optional(),
});

export type RecuperacaoResumo = z.infer<typeof recuperacaoResumoSchema>;

export function createRecuperacaoExecucaoFormSchema(
  quantidadeRecuperar: number,
) {
  return recuperacaoExecucaoFormSchema.superRefine((data, ctx) => {
    if (data.qtyAvariada > quantidadeRecuperar) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Qtd avariada não pode exceder ${quantidadeRecuperar} un`,
        path: ['qtyAvariada'],
      });
    }
    if (data.qtyRecuperada > data.qtyAvariada) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Qtd recuperada não pode exceder a qtd avariada',
        path: ['qtyRecuperada'],
      });
    }
  });
}
