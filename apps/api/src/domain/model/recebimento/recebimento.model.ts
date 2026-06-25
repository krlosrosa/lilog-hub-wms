import { z } from 'zod';

export const PreRecebimentoSituacaoSchema = z.enum([
  'agendado',
  'veiculo_chegou',
  'em_recebimento',
  'aguardando_aprovacao',
  'aprovado',
  'finalizado',
  'cancelado',
]);

export type PreRecebimentoSituacao = z.infer<
  typeof PreRecebimentoSituacaoSchema
>;

export const RecebimentoSituacaoSchema = z.enum([
  'em_recebimento',
  'aguardando_aprovacao',
  'aprovado',
  'finalizado',
  'cancelado',
]);

export type RecebimentoSituacao = z.infer<typeof RecebimentoSituacaoSchema>;

export const TipoDivergenciaSchema = z.enum([
  'quantidade_maior',
  'quantidade_menor',
  'produto_nao_esperado',
  'produto_ausente',
  'divergencia_lote',
  'divergencia_peso',
  'divergencia_validade',
]);

export type TipoDivergencia = z.infer<typeof TipoDivergenciaSchema>;

export const ItemPreRecebimentoInputSchema = z.object({
  produtoId: z.uuid(),
  quantidadeEsperada: z.number().positive(),
  unidadeMedida: z.string().min(1).max(20),
  loteEsperado: z.string().optional(),
  pesoEsperado: z.number().positive().optional(),
  validadeEsperada: z.coerce.date().optional(),
});

export type ItemPreRecebimentoInput = z.infer<
  typeof ItemPreRecebimentoInputSchema
>;

export const CreatePreRecebimentoInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transportadoraId: z.string().min(1).max(50),
  placa: z.string().min(1).max(20),
  horarioPrevisto: z.coerce.date(),
  observacao: z.string().optional(),
  itens: z.array(ItemPreRecebimentoInputSchema).min(1),
});

export type CreatePreRecebimentoInput = z.infer<
  typeof CreatePreRecebimentoInputSchema
>;

export const UpdatePreRecebimentoInputSchema = z.object({
  transportadoraId: z.string().min(1).max(50).optional(),
  placa: z.string().min(1).max(20).optional(),
  horarioPrevisto: z.coerce.date().optional(),
  observacao: z.string().nullable().optional(),
  itens: z.array(ItemPreRecebimentoInputSchema).min(1).optional(),
});

export type UpdatePreRecebimentoInput = z.infer<
  typeof UpdatePreRecebimentoInputSchema
>;

export const ConferirItemInputSchema = z.object({
  produtoId: z.uuid(),
  quantidadeRecebida: z.number().nonnegative(),
  unidadeMedida: z.string().min(1).max(20),
  loteRecebido: z.string().optional(),
  pesoRecebido: z.number().positive().optional(),
  validade: z.coerce.date().optional(),
  numeroSerie: z.string().optional(),
  unitizadorCodigo: z.string().min(1).optional(),
});

export type ConferirItemInput = z.infer<typeof ConferirItemInputSchema>;

export const IniciarRecebimentoInputSchema = z.object({
  preRecebimentoId: z.uuid(),
  docaId: z.uuid().optional(),
  responsavelId: z.number().int().positive(),
});

export type IniciarRecebimentoInput = z.infer<
  typeof IniciarRecebimentoInputSchema
>;

export const CreateChecklistRecebimentoInputSchema = z.object({
  lacre: z.string().max(100).optional(),
  tempBau: z.number().optional(),
  tempProduto: z.number().optional(),
  conditions: z.object({
    limpeza: z.boolean(),
    odor: z.boolean(),
    estrutura: z.boolean(),
    vedacao: z.boolean(),
  }),
  observacoes: z.string().optional(),
  photoCount: z.number().int().min(0).optional(),
});

export type CreateChecklistRecebimentoInput = z.infer<
  typeof CreateChecklistRecebimentoInputSchema
>;

export const PESO_DIVERGENCIA_TOLERANCIA = 0.001;

export function canEditPreRecebimento(situacao: PreRecebimentoSituacao): boolean {
  return situacao === 'agendado';
}

export function canCancelPreRecebimento(
  situacao: PreRecebimentoSituacao,
): boolean {
  return situacao === 'agendado' || situacao === 'aguardando_aprovacao';
}
