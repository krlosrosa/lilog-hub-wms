import { z } from 'zod';

export const sugestaoEtiquetaProdutoSchema = z.object({
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  quantidadeTotalUN: z.number(),
  capacidadePorPaleteUN: z.number().int().positive(),
  qtdPaletesSugerida: z.number().int().positive(),
  lote: z.string().nullable(),
  validade: z.string().nullable(),
});

export type SugestaoEtiquetaProduto = z.infer<typeof sugestaoEtiquetaProdutoSchema>;

export const sugestaoEtiquetasRecebimentoSchema = z.object({
  recebimentoId: z.string().uuid(),
  numeroRecebimento: z.string(),
  itens: z.array(sugestaoEtiquetaProdutoSchema),
});

export type SugestaoEtiquetasRecebimento = z.infer<
  typeof sugestaoEtiquetasRecebimentoSchema
>;

export const paleteFinalizacaoInputSchema = z.object({
  produtoId: z.string(),
  qtdPaletes: z.number().int().min(1),
});

export type PaleteFinalizacaoInput = z.infer<
  typeof paleteFinalizacaoInputSchema
>;

export const etiquetaPaleteGeradaSchema = z.object({
  unitizadorId: z.string().uuid(),
  codigo: z.string(),
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  lote: z.string().nullable(),
  validade: z.string().nullable(),
  enderecoSugeridoLabel: z.string().nullable(),
  numeroRecebimento: z.string(),
});

export type EtiquetaPaleteGerada = z.infer<typeof etiquetaPaleteGeradaSchema>;

export const previewPaleteArmazenagemSchema = z.object({
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  sequencia: z.number().int().positive(),
  sequenciaProduto: z.number().int().positive(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  lote: z.string().nullable(),
  validade: z.string().nullable(),
  codigoUnitizador: z.string(),
  enderecoSugeridoId: z.string().uuid().nullable(),
  enderecoSugeridoLabel: z.string().nullable(),
  disponivel: z.boolean(),
  alerta: z.string().nullable(),
});

export type PreviewPaleteArmazenagem = z.infer<typeof previewPaleteArmazenagemSchema>;

export const previewPaletesArmazenagemSchema = z.object({
  recebimentoId: z.string().uuid(),
  numeroRecebimento: z.string(),
  unidadeId: z.string(),
  paletes: z.array(previewPaleteArmazenagemSchema),
});

export type PreviewPaletesArmazenagem = z.infer<
  typeof previewPaletesArmazenagemSchema
>;

export const paleteValidadoFinalizacaoSchema = z.object({
  produtoId: z.string(),
  sequencia: z.number().int().positive(),
  quantidade: z.number().positive(),
  enderecoSugeridoId: z.string().uuid(),
  codigoUnitizador: z.string(),
});

export type PaleteValidadoFinalizacao = z.infer<
  typeof paleteValidadoFinalizacaoSchema
>;

export const previewPaleteBipadoItemSchema = z.object({
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  lote: z.string().nullable(),
  validade: z.string().nullable(),
});

export type PreviewPaleteBipadoItem = z.infer<typeof previewPaleteBipadoItemSchema>;

export const previewPaleteBipadoSchema = z.object({
  unitizadorId: z.string().uuid(),
  codigoUnitizador: z.string(),
  sequencia: z.number().int().positive(),
  itens: z.array(previewPaleteBipadoItemSchema),
  enderecoSugeridoId: z.string().uuid().nullable(),
  enderecoSugeridoLabel: z.string().nullable(),
  disponivel: z.boolean(),
  alerta: z.string().nullable(),
});

export type PreviewPaleteBipado = z.infer<typeof previewPaleteBipadoSchema>;

export const previewPaletesBipadosSchema = z.object({
  recebimentoId: z.string().uuid(),
  numeroRecebimento: z.string(),
  unidadeId: z.string(),
  paletes: z.array(previewPaleteBipadoSchema),
});

export type PreviewPaletesBipados = z.infer<typeof previewPaletesBipadosSchema>;

export const paleteBipadoValidadoFinalizacaoSchema = z.object({
  unitizadorId: z.string().uuid(),
  enderecoSugeridoId: z.string().uuid(),
});

export type PaleteBipadoValidadoFinalizacao = z.infer<
  typeof paleteBipadoValidadoFinalizacaoSchema
>;

export const finalizarRecebimentoComEtiquetasSchema = z.object({
  id: z.string().uuid(),
  preRecebimentoId: z.string().uuid(),
  situacao: z.string(),
  modoUnitizacao: z.string().optional(),
  etiquetas: z.array(etiquetaPaleteGeradaSchema).optional(),
});

export type FinalizarRecebimentoComEtiquetas = z.infer<
  typeof finalizarRecebimentoComEtiquetasSchema
>;

export type ModoUnitizacaoApi =
  | 'bipar_palete_no_recebimento'
  | 'gerar_etiqueta_na_armazenagem';
