import { and, asc, eq } from 'drizzle-orm';

import type { ListSessaoFuncionarioPausasResult } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  sessaoFuncionarioPausas,
  sessaoFuncionarios,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  calcularTotalPausasMinutos,
  mapSessaoPausaRow,
} from './map-sessao-pausa.drizzle.js';

export async function listSessaoFuncionarioPausasDb(
  db: DrizzleClient,
  sessaoId: string,
  funcionarioId: number,
): Promise<ListSessaoFuncionarioPausasResult> {
  const rows = await db
    .select({
      pausa: sessaoFuncionarioPausas,
    })
    .from(sessaoFuncionarioPausas)
    .innerJoin(
      sessaoFuncionarios,
      eq(sessaoFuncionarioPausas.sessaoFuncionarioId, sessaoFuncionarios.id),
    )
    .where(
      and(
        eq(sessaoFuncionarios.sessaoId, sessaoId),
        eq(sessaoFuncionarios.funcionarioId, funcionarioId),
      ),
    )
    .orderBy(asc(sessaoFuncionarioPausas.inicio));

  const items = rows.map((row) => mapSessaoPausaRow(row.pausa));
  const emPausaAgora = items.find((item) => item.fim === null) ?? null;

  return {
    items,
    totalPausasMinutos: calcularTotalPausasMinutos(items),
    emPausaAgora,
  };
}
