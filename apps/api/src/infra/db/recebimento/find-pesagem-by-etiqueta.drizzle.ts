import { and, eq, isNotNull } from 'drizzle-orm';

import type { PesagemRecebimentoRecord } from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { pesagensRecebimento } from '../providers/drizzle/config/migrations/schema.js';
import { mapPesagemRecebimentoRow } from './map-recebimento.drizzle.js';

export async function findPesagemByEtiquetaDb(
  db: DrizzleClient,
  unidadeId: string,
  etiquetaCodigo: string,
): Promise<PesagemRecebimentoRecord | null> {
  const normalized = etiquetaCodigo.trim();
  if (!normalized) {
    return null;
  }

  const [row] = await db
    .select()
    .from(pesagensRecebimento)
    .where(
      and(
        eq(pesagensRecebimento.unidadeId, unidadeId),
        eq(pesagensRecebimento.etiquetaCodigo, normalized),
        isNotNull(pesagensRecebimento.etiquetaCodigo),
      ),
    )
    .limit(1);

  return row ? mapPesagemRecebimentoRow(row) : null;
}
