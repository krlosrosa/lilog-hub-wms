import { eq } from 'drizzle-orm';

import type { ChecklistRecebimentoRecord } from '../../../domain/repositories/recebimento/conferencia.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { checklistRecebimento } from '../providers/drizzle/config/migrations/schema.js';

function mapChecklistRow(
  row: typeof checklistRecebimento.$inferSelect,
): ChecklistRecebimentoRecord {
  return {
    id: row.id,
    recebimentoId: row.recebimentoId,
    lacre: row.lacre,
    tempBau: row.tempBau != null ? Number(row.tempBau) : null,
    tempProduto: row.tempProduto != null ? Number(row.tempProduto) : null,
    condicaoLimpeza: row.condicaoLimpeza,
    condicaoOdor: row.condicaoOdor,
    condicaoEstrutura: row.condicaoEstrutura,
    condicaoVedacao: row.condicaoVedacao,
    observacoes: row.observacoes,
    photoCount: row.photoCount,
    createdAt: row.createdAt,
  };
}

export async function findChecklistRecebimentoDb(
  db: DrizzleClient,
  recebimentoId: string,
): Promise<ChecklistRecebimentoRecord | null> {
  const [row] = await db
    .select()
    .from(checklistRecebimento)
    .where(eq(checklistRecebimento.recebimentoId, recebimentoId))
    .limit(1);

  return row ? mapChecklistRow(row) : null;
}
