import { eq } from 'drizzle-orm';

import type { PreRecebimentoWithItens } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  itensPreRecebimento,
  preRecebimentos,
  produtos,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapItemPreRecebimentoRow,
  mapPreRecebimentoRow,
} from './map-recebimento.drizzle.js';

export async function findPreRecebimentoByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<PreRecebimentoWithItens | null> {
  const [preRecebimento] = await db
    .select()
    .from(preRecebimentos)
    .where(eq(preRecebimentos.id, id))
    .limit(1);

  if (!preRecebimento) {
    return null;
  }

  const itens = await db
    .select({ item: itensPreRecebimento, produto: produtos })
    .from(itensPreRecebimento)
    .leftJoin(produtos, eq(itensPreRecebimento.produtoId, produtos.id))
    .where(eq(itensPreRecebimento.preRecebimentoId, id));

  return {
    ...mapPreRecebimentoRow(preRecebimento),
    itens: itens.map((row) =>
      mapItemPreRecebimentoRow(row.item, row.produto?.unidadesPorCaixa ?? 1),
    ),
  };
}
