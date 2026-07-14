import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';

import type { SessaoFuncionarioRecebimentoAbertaRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipes,
  sessaoFuncionarios,
  sessoesTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';

export async function findSessaoFuncionarioRecebimentoAbertaDb(
  db: DrizzleClient,
  unidadeId: string,
  funcionarioId: number,
): Promise<SessaoFuncionarioRecebimentoAbertaRecord | null> {
  const rows = await db
    .select({
      sessaoId: sessoesTrabalho.id,
      sessaoFuncionarioId: sessaoFuncionarios.id,
      funcionarioId: sessaoFuncionarios.funcionarioId,
      tipoVinculo: sessaoFuncionarios.tipoVinculo,
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
        eq(equipes.area, 'recebimento'),
        eq(sessaoFuncionarios.funcionarioId, funcionarioId),
        inArray(sessaoFuncionarios.status, ['presente', 'atraso']),
        or(
          eq(sessaoFuncionarios.tipoVinculo, 'titular'),
          and(
            eq(sessaoFuncionarios.tipoVinculo, 'apoio'),
            isNull(sessaoFuncionarios.apoioFim),
          ),
        ),
      ),
    )
    .orderBy(
      sql`case when ${sessaoFuncionarios.tipoVinculo} = 'titular' then 0 else 1 end`,
    )
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    sessaoId: row.sessaoId,
    sessaoFuncionarioId: row.sessaoFuncionarioId,
    funcionarioId: row.funcionarioId,
  };
}
