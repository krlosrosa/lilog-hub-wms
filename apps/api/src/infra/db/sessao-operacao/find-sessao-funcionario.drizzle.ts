import { and, eq } from 'drizzle-orm';

import type { SessaoFuncionarioRefRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { sessaoFuncionarios } from '../providers/drizzle/config/migrations/schema.js';

export async function findSessaoFuncionarioDb(
  db: DrizzleClient,
  sessaoId: string,
  funcionarioId: number,
): Promise<SessaoFuncionarioRefRecord | null> {
  const [row] = await db
    .select({
      id: sessaoFuncionarios.id,
      funcionarioId: sessaoFuncionarios.funcionarioId,
      status: sessaoFuncionarios.status,
    })
    .from(sessaoFuncionarios)
    .where(
      and(
        eq(sessaoFuncionarios.sessaoId, sessaoId),
        eq(sessaoFuncionarios.funcionarioId, funcionarioId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function findSessaoFuncionarioByIdDb(
  db: DrizzleClient,
  sessaoId: string,
  sessaoFuncionarioId: string,
): Promise<SessaoFuncionarioRefRecord | null> {
  const [row] = await db
    .select({
      id: sessaoFuncionarios.id,
      funcionarioId: sessaoFuncionarios.funcionarioId,
      status: sessaoFuncionarios.status,
    })
    .from(sessaoFuncionarios)
    .where(
      and(
        eq(sessaoFuncionarios.sessaoId, sessaoId),
        eq(sessaoFuncionarios.id, sessaoFuncionarioId),
      ),
    )
    .limit(1);

  return row ?? null;
}
