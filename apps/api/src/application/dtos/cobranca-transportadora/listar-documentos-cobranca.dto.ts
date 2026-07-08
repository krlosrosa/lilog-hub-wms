import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DocumentoCobrancaStatusSchema = z.enum([
  'rascunho',
  'emitido',
  'enviado',
  'pago',
  'cancelado',
]);

export const ListarDocumentosCobrancaQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  status: DocumentoCobrancaStatusSchema.optional(),
  transportadoraId: z.uuid().optional(),
});

export class ListarDocumentosCobrancaQueryDto extends createZodDto(
  ListarDocumentosCobrancaQuerySchema,
) {}

export const DocumentoCobrancaListItemSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  numeroDocumento: z.string(),
  transportadoraId: z.uuid().nullable(),
  transportadoraNome: z.string(),
  status: DocumentoCobrancaStatusSchema,
  valorTotal: z.number().nonnegative(),
  quantidadeProcessos: z.number().int().nonnegative(),
  quantidadeItens: z.number().int().nonnegative(),
  emitidoEm: z.iso.datetime().nullable(),
  enviadoEm: z.iso.datetime().nullable(),
  pagoEm: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const ListarDocumentosCobrancaResponseSchema = z.object({
  documentos: z.array(DocumentoCobrancaListItemSchema),
});

export class ListarDocumentosCobrancaResponseDto extends createZodDto(
  ListarDocumentosCobrancaResponseSchema,
) {}

export const BuscarDocumentoCobrancaQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class BuscarDocumentoCobrancaQueryDto extends createZodDto(
  BuscarDocumentoCobrancaQuerySchema,
) {}

export const DocumentoCobrancaItemSchema = z.object({
  id: z.uuid(),
  documentoCobrancaId: z.uuid(),
  processoDebitoId: z.uuid(),
  processoDebitoItemId: z.uuid(),
  valorDebito: z.number().nonnegative(),
  demandaId: z.uuid(),
  codigoDemanda: z.string(),
  sku: z.string().nullable(),
  tipo: z.enum(['falta', 'avaria', 'sobra']),
  createdAt: z.iso.datetime(),
});

export const CobrancaEventoDocumentoSchema = z.object({
  id: z.uuid(),
  entidadeTipo: z.enum(['processo', 'documento']),
  entidadeId: z.uuid(),
  statusAnterior: z.string().nullable(),
  statusNovo: z.string(),
  descricao: z.string().nullable(),
  criadoPorUserId: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
});

export const BuscarDocumentoCobrancaResponseSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  numeroDocumento: z.string(),
  transportadoraId: z.uuid().nullable(),
  transportadoraNome: z.string(),
  status: DocumentoCobrancaStatusSchema,
  valorTotal: z.number().nonnegative(),
  quantidadeProcessos: z.number().int().nonnegative(),
  quantidadeItens: z.number().int().nonnegative(),
  observacao: z.string().nullable(),
  emitidoEm: z.iso.datetime().nullable(),
  enviadoEm: z.iso.datetime().nullable(),
  pagoEm: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  itens: z.array(DocumentoCobrancaItemSchema),
  eventos: z.array(CobrancaEventoDocumentoSchema),
});

export class BuscarDocumentoCobrancaResponseDto extends createZodDto(
  BuscarDocumentoCobrancaResponseSchema,
) {}

export const CriarDocumentoCobrancaResponseSchema = z.object({
  id: z.uuid(),
  numeroDocumento: z.string(),
  status: DocumentoCobrancaStatusSchema,
  valorTotal: z.number().nonnegative(),
  quantidadeProcessos: z.number().int().nonnegative(),
  quantidadeItens: z.number().int().nonnegative(),
});

export class CriarDocumentoCobrancaResponseDto extends createZodDto(
  CriarDocumentoCobrancaResponseSchema,
) {}

export const AtualizarStatusDocumentoCobrancaQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

export class AtualizarStatusDocumentoCobrancaQueryDto extends createZodDto(
  AtualizarStatusDocumentoCobrancaQuerySchema,
) {}

export const AtualizarStatusDocumentoCobrancaResponseSchema = z.object({
  id: z.uuid(),
  status: DocumentoCobrancaStatusSchema,
  statusAnterior: DocumentoCobrancaStatusSchema,
  updatedAt: z.iso.datetime(),
  emitidoEm: z.iso.datetime().nullable(),
  enviadoEm: z.iso.datetime().nullable(),
  pagoEm: z.iso.datetime().nullable(),
});

export class AtualizarStatusDocumentoCobrancaResponseDto extends createZodDto(
  AtualizarStatusDocumentoCobrancaResponseSchema,
) {}
