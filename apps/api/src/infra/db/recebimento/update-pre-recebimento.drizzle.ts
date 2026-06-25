import { eq } from 'drizzle-orm';

import type { UpdatePreRecebimentoInput } from '../../../domain/model/recebimento/recebimento.model.js';
import type { PreRecebimentoWithItens } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  itensPreRecebimento,
  preRecebimentos,
} from '../providers/drizzle/config/migrations/schema.js';
import { findPreRecebimentoByIdDb } from './find-pre-recebimento.drizzle.js';
import {
  toItemPreRecebimentoInsertValues,
  toPreRecebimentoUpdateValues,
} from './map-recebimento.drizzle.js';

export async function updatePreRecebimentoDb(
  db: DrizzleClient,
  id: string,
  data: UpdatePreRecebimentoInput,
): Promise<PreRecebimentoWithItens | null> {
  const updateValues = toPreRecebimentoUpdateValues(data);

  if (Object.keys(updateValues).length > 1) {
    await db
      .update(preRecebimentos)
      .set(updateValues)
      .where(eq(preRecebimentos.id, id));
  }

  if (data.itens) {
    await db
      .delete(itensPreRecebimento)
      .where(eq(itensPreRecebimento.preRecebimentoId, id));

    await db.insert(itensPreRecebimento).values(
      data.itens.map((item) => toItemPreRecebimentoInsertValues(id, item)),
    );
  }

  return findPreRecebimentoByIdDb(db, id);
}
