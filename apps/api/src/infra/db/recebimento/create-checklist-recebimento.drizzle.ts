import type { CreateChecklistRecebimentoInput } from '../../../domain/model/recebimento/recebimento.model.js';
import type { ChecklistRecebimentoRecord } from '../../../domain/repositories/recebimento/conferencia.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { checklistRecebimento } from '../providers/drizzle/config/migrations/schema.js';

function mapChecklistRow(
  row: typeof checklistRecebimento.$inferSelect,
): ChecklistRecebimentoRecord {
  const conditions =
    row.conditions ??
    ({
      limpeza: row.condicaoLimpeza,
      odor: row.condicaoOdor,
      estrutura: row.condicaoEstrutura,
      vedacao: row.condicaoVedacao,
    } satisfies Record<string, boolean>);

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
    conditions,
    observacoes: row.observacoes,
    photoCount: row.photoCount,
    createdAt: row.createdAt,
  };
}

function toChecklistValues(
  recebimentoId: string,
  data: CreateChecklistRecebimentoInput,
) {
  return {
    recebimentoId,
    lacre: data.lacre ?? null,
    tempBau: data.tempBau != null ? String(data.tempBau) : null,
    tempProduto: data.tempProduto != null ? String(data.tempProduto) : null,
    condicaoLimpeza: data.conditions.limpeza ?? false,
    condicaoOdor: data.conditions.odor ?? false,
    condicaoEstrutura: data.conditions.estrutura ?? false,
    condicaoVedacao: data.conditions.vedacao ?? false,
    conditions: data.conditions,
    observacoes: data.observacoes ?? null,
    photoCount: data.photoCount ?? 0,
  };
}

export async function createChecklistRecebimentoDb(
  db: DrizzleClient,
  recebimentoId: string,
  data: CreateChecklistRecebimentoInput,
): Promise<ChecklistRecebimentoRecord> {
  const values = toChecklistValues(recebimentoId, data);

  const rows = await db
    .insert(checklistRecebimento)
    .values(values)
    .onConflictDoUpdate({
      target: checklistRecebimento.recebimentoId,
      set: {
        lacre: values.lacre,
        tempBau: values.tempBau,
        tempProduto: values.tempProduto,
        condicaoLimpeza: values.condicaoLimpeza,
        condicaoOdor: values.condicaoOdor,
        condicaoEstrutura: values.condicaoEstrutura,
        condicaoVedacao: values.condicaoVedacao,
        conditions: values.conditions,
        observacoes: values.observacoes,
        photoCount: values.photoCount,
      },
    })
    .returning();

  const row = rows[0];
  if (!row) {
    throw new Error('Falha ao persistir checklist de recebimento');
  }

  return mapChecklistRow(row);
}
