import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { documentos } from '../providers/drizzle/config/migrations/schema.js';
import { mapDocumentoRow } from './map-documento.drizzle.js';

export async function findDocumentoByIdDb(db: DrizzleClient, id: string) {
  const [row] = await db
    .select()
    .from(documentos)
    .where(eq(documentos.id, id))
    .limit(1);

  return row ? mapDocumentoRow(row) : null;
}

export async function findDocumentoByChaveDb(db: DrizzleClient, chave: string) {
  const [row] = await db
    .select()
    .from(documentos)
    .where(eq(documentos.chave, chave))
    .limit(1);

  return row ? mapDocumentoRow(row) : null;
}
