import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DocumentoStatusSchema } from '../../../domain/model/documento/documento.model.js';

export const DocumentoResponseSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  chave: z.string(),
  mimeType: z.string(),
  tamanho: z.number().int(),
  entidadeTipo: z.string().nullable(),
  entidadeId: z.string().nullable(),
  status: DocumentoStatusSchema,
  uploadedBy: z.number().int().nullable(),
  createdAt: z.iso.datetime(),
});

export class DocumentoResponseDto extends createZodDto(DocumentoResponseSchema) {}

export const ListDocumentosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entidadeTipo: z.string().min(1).max(50).optional(),
  entidadeId: z.string().min(1).max(100).optional(),
  status: DocumentoStatusSchema.optional(),
});

export class ListDocumentosQueryDto extends createZodDto(
  ListDocumentosQuerySchema,
) {}

export const ListDocumentosResponseSchema = z.object({
  items: z.array(DocumentoResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListDocumentosResponseDto extends createZodDto(
  ListDocumentosResponseSchema,
) {}

export const UploadUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  chave: z.string(),
  expiresIn: z.number().int(),
});

export class UploadUrlResponseDto extends createZodDto(UploadUrlResponseSchema) {}

export const DownloadUrlResponseSchema = z.object({
  downloadUrl: z.string().url(),
  expiresIn: z.number().int(),
});

export class DownloadUrlResponseDto extends createZodDto(
  DownloadUrlResponseSchema,
) {}
