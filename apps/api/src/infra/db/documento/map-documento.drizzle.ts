import type { DocumentoRecord } from '../../../domain/repositories/documento/documento.repository.js';
import type { documentos } from '../providers/drizzle/config/migrations/schema.js';

type DocumentoRow = typeof documentos.$inferSelect;

export function mapDocumentoRow(row: DocumentoRow): DocumentoRecord {
  return {
    id: row.id,
    nome: row.nome,
    chave: row.chave,
    mimeType: row.mimeType,
    tamanho: row.tamanho,
    entidadeTipo: row.entidadeTipo,
    entidadeId: row.entidadeId,
    status: row.status,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt,
  };
}
