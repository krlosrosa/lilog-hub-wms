import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SugestaoEtiquetaProdutoSchema = z.object({
  produtoId: z.string().min(1).max(50),
  sku: z.string(),
  descricao: z.string(),
  quantidadeTotalUN: z.number(),
  capacidadePorPaleteUN: z.number().int().positive(),
  qtdPaletesSugerida: z.number().int().positive(),
  lote: z.string().nullable(),
  validade: z.iso.datetime().nullable(),
});

export class SugestaoEtiquetaProdutoDto extends createZodDto(
  SugestaoEtiquetaProdutoSchema,
) {}

export const SugestaoEtiquetasRecebimentoResponseSchema = z.object({
  recebimentoId: z.uuid(),
  numeroRecebimento: z.string(),
  itens: z.array(SugestaoEtiquetaProdutoSchema),
});

export class SugestaoEtiquetasRecebimentoResponseDto extends createZodDto(
  SugestaoEtiquetasRecebimentoResponseSchema,
) {}

export const PaleteFinalizacaoInputSchema = z.object({
  produtoId: z.string().min(1).max(50),
  qtdPaletes: z.number().int().min(1).optional(),
  sequencia: z.number().int().min(1).optional(),
  quantidade: z.number().positive().optional(),
  enderecoSugeridoId: z.uuid().optional(),
  codigoUnitizador: z.string().min(1).optional(),
});

export const PaleteBipadoValidadoInputSchema = z.object({
  unitizadorId: z.uuid(),
  enderecoSugeridoId: z.uuid(),
});

export const FinalizarRecebimentoBodySchema = z.object({
  paletes: z.array(PaleteFinalizacaoInputSchema).optional(),
  paletesBipadosValidados: z.array(PaleteBipadoValidadoInputSchema).optional(),
});

export class FinalizarRecebimentoBodyDto extends createZodDto(
  FinalizarRecebimentoBodySchema,
) {}

export const EtiquetaPaleteGeradaSchema = z.object({
  unitizadorId: z.uuid(),
  codigo: z.string(),
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  lote: z.string().nullable(),
  validade: z.iso.datetime().nullable(),
  enderecoSugeridoLabel: z.string().nullable(),
  numeroRecebimento: z.string(),
});

export class EtiquetaPaleteGeradaDto extends createZodDto(
  EtiquetaPaleteGeradaSchema,
) {}

export const FinalizarRecebimentoResponseSchema = z.object({
  id: z.uuid(),
  preRecebimentoId: z.uuid(),
  docaId: z.uuid().nullable(),
  responsavelId: z.number().int(),
  dataInicio: z.iso.datetime(),
  dataFim: z.iso.datetime().nullable(),
  situacao: z.string(),
  modoUnitizacao: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  etiquetas: z.array(EtiquetaPaleteGeradaSchema).optional(),
});

export class FinalizarRecebimentoResponseDto extends createZodDto(
  FinalizarRecebimentoResponseSchema,
) {}

export const PreviewPaleteArmazenagemSchema = z.object({
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  sequencia: z.number().int().positive(),
  sequenciaProduto: z.number().int().positive(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  lote: z.string().nullable(),
  validade: z.iso.datetime().nullable(),
  codigoUnitizador: z.string(),
  enderecoSugeridoId: z.uuid().nullable(),
  enderecoSugeridoLabel: z.string().nullable(),
  disponivel: z.boolean(),
  alerta: z.string().nullable(),
});

export class PreviewPaleteArmazenagemDto extends createZodDto(
  PreviewPaleteArmazenagemSchema,
) {}

export const PreviewPaletesArmazenagemResponseSchema = z.object({
  recebimentoId: z.uuid(),
  numeroRecebimento: z.string(),
  unidadeId: z.string(),
  itensAguardandoArmazenagem: z.array(
    z.object({
      produtoId: z.string(),
      quantidade: z.number(),
      unidadeMedida: z.string(),
      lote: z.string().nullable(),
      validade: z.iso.datetime().nullable(),
    }),
  ),
  paletes: z.array(PreviewPaleteArmazenagemSchema),
});

export class PreviewPaletesArmazenagemResponseDto extends createZodDto(
  PreviewPaletesArmazenagemResponseSchema,
) {}

export const PreviewPaleteBipadoItemSchema = z.object({
  produtoId: z.string(),
  sku: z.string(),
  descricao: z.string(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  lote: z.string().nullable(),
  validade: z.iso.datetime().nullable(),
});

export const PreviewPaleteBipadoSchema = z.object({
  unitizadorId: z.uuid(),
  codigoUnitizador: z.string(),
  sequencia: z.number().int().positive(),
  itens: z.array(PreviewPaleteBipadoItemSchema),
  enderecoSugeridoId: z.uuid().nullable(),
  enderecoSugeridoLabel: z.string().nullable(),
  disponivel: z.boolean(),
  alerta: z.string().nullable(),
});

export class PreviewPaleteBipadoDto extends createZodDto(PreviewPaleteBipadoSchema) {}

export const PreviewPaletesBipadosResponseSchema = z.object({
  recebimentoId: z.uuid(),
  numeroRecebimento: z.string(),
  unidadeId: z.string(),
  paletes: z.array(PreviewPaleteBipadoSchema),
});

export class PreviewPaletesBipadosResponseDto extends createZodDto(
  PreviewPaletesBipadosResponseSchema,
) {}

export const ImprimirEtiquetasRecebimentoBodySchema = z.object({
  etiquetas: z.array(EtiquetaPaleteGeradaSchema).min(1).optional(),
});

export class ImprimirEtiquetasRecebimentoBodyDto extends createZodDto(
  ImprimirEtiquetasRecebimentoBodySchema,
) {}

export type ImprimirEtiquetasRecebimentoBodyInput = z.infer<
  typeof ImprimirEtiquetasRecebimentoBodySchema
>;

export type ImprimirEtiquetasRecebimentoResult = {
  buffer: Buffer;
  filename: string;
};
