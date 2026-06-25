import type { CreatePendingDocumentoInput } from '../../../domain/repositories/documento/documento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { documentos } from '../providers/drizzle/config/migrations/schema.js';
import { mapDocumentoRow } from './map-documento.drizzle.js';

export async function createPendingDocumentoDb(
  db: DrizzleClient,
  data: CreatePendingDocumentoInput,
) {
  const [row] = await db
    .insert(documentos)
    .values({
      nome: data.nome,
      chave: data.chave,
      mimeType: data.mimeType,
      tamanho: data.tamanho,
      entidadeTipo: data.entidadeTipo ?? null,
      entidadeId: data.entidadeId ?? null,
      status: 'pending',
      uploadedBy: data.uploadedBy,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to create pending documento');
  }

  return mapDocumentoRow(row);
}
