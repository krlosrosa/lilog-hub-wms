import { eq } from 'drizzle-orm';

import type { ActivateDocumentoInput } from '../../../domain/repositories/documento/documento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { documentos } from '../providers/drizzle/config/migrations/schema.js';
import { mapDocumentoRow } from './map-documento.drizzle.js';

export async function activateDocumentoDb(
  db: DrizzleClient,
  chave: string,
  data: ActivateDocumentoInput,
) {
  const [row] = await db
    .update(documentos)
    .set({
      nome: data.nome,
      mimeType: data.mimeType,
      tamanho: data.tamanho,
      entidadeTipo: data.entidadeTipo ?? null,
      entidadeId: data.entidadeId ?? null,
      status: 'ativo',
      uploadedBy: data.uploadedBy,
    })
    .where(eq(documentos.chave, chave))
    .returning();

  return row ? mapDocumentoRow(row) : null;
}

export async function markDocumentoDeletedDb(db: DrizzleClient, id: string) {
  const [row] = await db
    .update(documentos)
    .set({ status: 'deletado' })
    .where(eq(documentos.id, id))
    .returning();

  return row ? mapDocumentoRow(row) : null;
}
