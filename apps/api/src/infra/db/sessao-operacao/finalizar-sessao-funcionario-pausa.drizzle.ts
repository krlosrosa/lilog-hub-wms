import { and, eq, isNull } from 'drizzle-orm';

import type { SessaoFuncionarioPausaRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { sessaoFuncionarioPausas } from '../providers/drizzle/config/migrations/schema.js';
import { mapSessaoPausaRow } from './map-sessao-pausa.drizzle.js';

export async function finalizarSessaoFuncionarioPausaDb(
  db: DrizzleClient,
  sessaoFuncionarioId: string,
): Promise<SessaoFuncionarioPausaRecord | null> {
  const now = new Date();

  const [updated] = await db
    .update(sessaoFuncionarioPausas)
    .set({
      fim: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(sessaoFuncionarioPausas.sessaoFuncionarioId, sessaoFuncionarioId),
        isNull(sessaoFuncionarioPausas.fim),
      ),
    )
    .returning();

  return updated ? mapSessaoPausaRow(updated) : null;
}
