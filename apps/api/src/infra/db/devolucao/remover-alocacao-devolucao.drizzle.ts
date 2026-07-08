import { and, eq } from 'drizzle-orm';

import type { RemoverAlocacaoDevolucaoResult } from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoAlocacoes,
} from '../providers/drizzle/config/migrations/schema.js';

export async function removerAlocacaoDevolucaoDb(
  db: DrizzleClient,
  alocacaoId: string,
  unidadeId: string,
): Promise<RemoverAlocacaoDevolucaoResult | null> {
  const [alocacao] = await db
    .select({
      id: devolucaoAlocacoes.id,
      demandaId: devolucaoAlocacoes.demandaId,
      unidadeId: demandasDevolucao.unidadeId,
    })
    .from(devolucaoAlocacoes)
    .innerJoin(
      demandasDevolucao,
      eq(devolucaoAlocacoes.demandaId, demandasDevolucao.id),
    )
    .where(eq(devolucaoAlocacoes.id, alocacaoId))
    .limit(1);

  if (!alocacao || alocacao.unidadeId !== unidadeId) {
    return null;
  }

  const [updated] = await db
    .update(devolucaoAlocacoes)
    .set({
      status: 'cancelada',
      fimEm: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(devolucaoAlocacoes.id, alocacaoId),
        eq(devolucaoAlocacoes.status, 'em_andamento'),
      ),
    )
    .returning({
      id: devolucaoAlocacoes.id,
      demandaId: devolucaoAlocacoes.demandaId,
    });

  return updated ?? null;
}
