import { randomUUID } from 'node:crypto';

import { z } from 'zod';

export const DocumentoStatusSchema = z.enum(['pending', 'ativo', 'deletado']);
export type DocumentoStatus = z.infer<typeof DocumentoStatusSchema>;

export const DocumentoSchema = z.object({
  id: z.uuid(),
  nome: z.string().min(1).max(255),
  chave: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  tamanho: z.number().int().positive(),
  entidadeTipo: z.string().min(1).max(50).nullable(),
  entidadeId: z.string().min(1).max(100).nullable(),
  status: DocumentoStatusSchema,
  uploadedBy: z.number().int().positive().nullable(),
  createdAt: z.coerce.date(),
});

export type Documento = z.infer<typeof DocumentoSchema>;

export const GenerateUploadUrlInputSchema = z.object({
  nome: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  tamanho: z
    .number()
    .int()
    .positive()
    .max(100 * 1024 * 1024, 'Arquivo não pode exceder 100MB'),
  entidadeTipo: z.string().min(1).max(50).optional(),
  entidadeId: z.string().min(1).max(100).optional(),
});

export type GenerateUploadUrlInput = z.infer<
  typeof GenerateUploadUrlInputSchema
>;

export const ConfirmUploadInputSchema = z.object({
  chave: z.string().min(1).max(500),
  nome: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  tamanho: z.number().int().positive(),
  entidadeTipo: z.string().min(1).max(50).optional(),
  entidadeId: z.string().min(1).max(100).optional(),
});

export type ConfirmUploadInput = z.infer<typeof ConfirmUploadInputSchema>;

export function buildDocumentoChave(nome: string): string {
  const id = randomUUID();
  const sanitized = nome.replace(/[^a-zA-Z0-9._-]/g, '_');

  return `documentos/${id}/${sanitized}`;
}
