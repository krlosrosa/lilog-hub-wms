import { eq } from 'drizzle-orm';

import type { RecepcionarCarroInput } from '../../../domain/model/recebimento/recebimento.model.js';
import type { PreRecebimentoRecord } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { preRecebimentos } from '../providers/drizzle/config/migrations/schema.js';
import { mapPreRecebimentoRow } from './map-recebimento.drizzle.js';

function normalizePlaca(placa?: string): string | undefined {
  const trimmed = placa?.trim();
  return trimmed ? trimmed.toUpperCase() : undefined;
}

export async function recepcionarCarroPreRecebimentoDb(
  db: DrizzleClient,
  id: string,
  data: RecepcionarCarroInput,
): Promise<PreRecebimentoRecord | null> {
  const dataChegada = data.dataChegada
    ? new Date(data.dataChegada)
    : new Date();
  const placa = normalizePlaca(data.placa);

  const values: Partial<typeof preRecebimentos.$inferInsert> = {
    situacao: 'aguardando',
    dataChegada,
    motoristaNome: data.motoristaNome?.trim() || null,
    motoristaTelefone: data.motoristaTelefone?.trim() || null,
    grauPrioridade: data.grauPrioridade ?? null,
    updatedAt: new Date(),
  };

  if (placa !== undefined) {
    values.placa = placa;
  }

  const [updated] = await db
    .update(preRecebimentos)
    .set(values)
    .where(eq(preRecebimentos.id, id))
    .returning();

  return updated ? mapPreRecebimentoRow(updated) : null;
}
