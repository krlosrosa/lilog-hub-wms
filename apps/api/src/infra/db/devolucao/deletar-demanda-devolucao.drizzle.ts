import { and, eq } from 'drizzle-orm';

import type { DeletarDemandaDevolucaoResult } from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { demandasDevolucao } from '../providers/drizzle/config/migrations/schema.js';

export async function deletarDemandaDevolucaoDb(
  db: DrizzleClient,
  demandaId: string,
  unidadeId: string,
): Promise<DeletarDemandaDevolucaoResult | null> {
  const [deleted] = await db
    .delete(demandasDevolucao)
    .where(
      and(
        eq(demandasDevolucao.id, demandaId),
        eq(demandasDevolucao.unidadeId, unidadeId),
      ),
    )
    .returning({
      id: demandasDevolucao.id,
      codigoDemanda: demandasDevolucao.codigoDemanda,
    });

  if (!deleted) {
    return null;
  }

  return {
    id: deleted.id,
    codigoDemanda: deleted.codigoDemanda,
  };
}
