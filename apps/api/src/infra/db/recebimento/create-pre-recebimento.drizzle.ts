import type { CreatePreRecebimentoInput } from '../../../domain/model/recebimento/recebimento.model.js';
import type { PreRecebimentoWithItens } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  itensPreRecebimento,
  notasFiscaisPreRecebimento,
  preRecebimentos,
} from '../providers/drizzle/config/migrations/schema.js';
import { findPreRecebimentoByIdDb } from './find-pre-recebimento.drizzle.js';
import {
  toItemPreRecebimentoInsertValues,
  toNotaFiscalPreRecebimentoInsertValues,
  toPreRecebimentoInsertValues,
} from './map-recebimento.drizzle.js';

export async function createPreRecebimentoDb(
  db: DrizzleClient,
  data: CreatePreRecebimentoInput,
  userId: number | null,
): Promise<PreRecebimentoWithItens> {
  const [preRecebimento] = await db
    .insert(preRecebimentos)
    .values(toPreRecebimentoInsertValues(data, userId))
    .returning();

  if (!preRecebimento) {
    throw new Error('Failed to create pre-recebimento');
  }

  if (data.notasFiscais?.length) {
    await db.insert(notasFiscaisPreRecebimento).values(
      data.notasFiscais.map((nota) =>
        toNotaFiscalPreRecebimentoInsertValues(preRecebimento.id, nota),
      ),
    );
  }

  await db.insert(itensPreRecebimento).values(
    data.itens.map((item) =>
      toItemPreRecebimentoInsertValues(preRecebimento.id, item),
    ),
  );

  const created = await findPreRecebimentoByIdDb(db, preRecebimento.id);

  if (!created) {
    throw new Error('Failed to load created pre-recebimento');
  }

  return created;
}
