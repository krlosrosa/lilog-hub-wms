import { and, eq } from 'drizzle-orm';

import type {
  SalvarChecklistDevolucaoInput,
  SalvarChecklistDevolucaoResult,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoChecklist,
} from '../providers/drizzle/config/migrations/schema.js';

function toChecklistValues(
  demandaId: string,
  input: SalvarChecklistDevolucaoInput,
) {
  return {
    demandaId,
    dock: input.dock,
    paletesRecebidos: input.paletesRecebidos,
    tempBau: input.tempBau != null ? String(input.tempBau) : null,
    tempProduto: input.tempProduto != null ? String(input.tempProduto) : null,
    conditions: input.conditions,
    observacoes: input.observacoes ?? null,
    photoCount: input.photoCount ?? 0,
    criadoPorUserId: input.criadoPorUserId ?? null,
    updatedAt: new Date(),
  };
}

export async function salvarChecklistDevolucaoDb(
  db: DrizzleClient,
  input: SalvarChecklistDevolucaoInput,
): Promise<SalvarChecklistDevolucaoResult | null> {
  const [demanda] = await db
    .select({ id: demandasDevolucao.id })
    .from(demandasDevolucao)
    .where(
      and(
        eq(demandasDevolucao.id, input.demandaId),
        eq(demandasDevolucao.unidadeId, input.unidadeId),
      ),
    )
    .limit(1);

  if (!demanda) {
    return null;
  }

  const values = toChecklistValues(input.demandaId, input);

  const rows = await db
    .insert(devolucaoChecklist)
    .values(values)
    .onConflictDoUpdate({
      target: devolucaoChecklist.demandaId,
      set: {
        dock: values.dock,
        paletesRecebidos: values.paletesRecebidos,
        tempBau: values.tempBau,
        tempProduto: values.tempProduto,
        conditions: values.conditions,
        observacoes: values.observacoes,
        photoCount: values.photoCount,
        updatedAt: values.updatedAt,
      },
    })
    .returning({
      id: devolucaoChecklist.id,
      demandaId: devolucaoChecklist.demandaId,
    });

  const row = rows[0];
  if (!row) {
    throw new Error('Falha ao persistir checklist de devolução');
  }

  return row;
}
