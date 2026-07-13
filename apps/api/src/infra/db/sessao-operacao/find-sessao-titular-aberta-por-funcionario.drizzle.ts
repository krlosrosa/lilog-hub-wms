import { and, eq, inArray, ne } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipes,
  sessaoFuncionarios,
  sessoesTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';

export type SessaoTitularAbertaPorFuncionarioRecord = {
  sessaoId: string;
  equipeId: string;
  equipeNome: string;
};

export async function findSessaoTitularAbertaPorFuncionarioDb(
  db: DrizzleClient,
  unidadeId: string,
  funcionarioId: number,
  excludeSessaoId?: string,
): Promise<SessaoTitularAbertaPorFuncionarioRecord | null> {
  const rows = await db
    .select({
      sessaoId: sessoesTrabalho.id,
      equipeId: equipes.id,
      equipeNome: equipes.nome,
    })
    .from(sessaoFuncionarios)
    .innerJoin(
      sessoesTrabalho,
      eq(sessaoFuncionarios.sessaoId, sessoesTrabalho.id),
    )
    .innerJoin(equipes, eq(sessoesTrabalho.equipeId, equipes.id))
    .where(
      and(
        eq(sessoesTrabalho.unidadeId, unidadeId),
        eq(sessoesTrabalho.status, 'aberta'),
        eq(sessaoFuncionarios.funcionarioId, funcionarioId),
        eq(sessaoFuncionarios.tipoVinculo, 'titular'),
        inArray(sessaoFuncionarios.status, ['presente', 'atraso']),
        excludeSessaoId
          ? ne(sessoesTrabalho.id, excludeSessaoId)
          : undefined,
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}
