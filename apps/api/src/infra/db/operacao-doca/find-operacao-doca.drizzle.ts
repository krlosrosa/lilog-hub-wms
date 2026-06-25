import { and, eq, inArray } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { operacoesDoca } from '../providers/drizzle/config/migrations/schema.js';
import { mapOperacaoDocaRow } from './map-operacao-doca.drizzle.js';

const ACTIVE_SITUACOES = [
  'agendada',
  'aguardando_veiculo',
  'em_execucao',
] as const;

export async function findOperacaoDocaByIdDb(
  db: DrizzleClient,
  id: string,
) {
  const [row] = await db
    .select()
    .from(operacoesDoca)
    .where(eq(operacoesDoca.id, id))
    .limit(1);

  return row ? mapOperacaoDocaRow(row) : null;
}

export async function findActiveOperacaoByDocaIdDb(
  db: DrizzleClient,
  docaId: string,
) {
  const [row] = await db
    .select()
    .from(operacoesDoca)
    .where(
      and(
        eq(operacoesDoca.docaId, docaId),
        inArray(operacoesDoca.situacao, [...ACTIVE_SITUACOES]),
      ),
    )
    .limit(1);

  return row ? mapOperacaoDocaRow(row) : null;
}
