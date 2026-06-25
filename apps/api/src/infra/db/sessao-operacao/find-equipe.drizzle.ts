import { eq } from 'drizzle-orm';

import type { EquipeRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleExecutor } from '../providers/drizzle/drizzle.provider.js';
import { equipes } from '../providers/drizzle/config/migrations/schema.js';

export async function findEquipeByIdDb(
  db: DrizzleExecutor,
  id: string,
): Promise<EquipeRecord | null> {
  const [row] = await db
    .select({
      id: equipes.id,
      unidadeId: equipes.unidadeId,
      nome: equipes.nome,
      area: equipes.area,
      ativo: equipes.ativo,
      createdAt: equipes.createdAt,
      updatedAt: equipes.updatedAt,
    })
    .from(equipes)
    .where(eq(equipes.id, id))
    .limit(1);

  return row ?? null;
}
