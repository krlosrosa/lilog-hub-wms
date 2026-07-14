import { and, eq, inArray, isNull } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  preRecebimentos,
  recebimentoAlocacoes,
  recebimentos,
} from '../providers/drizzle/config/migrations/schema.js';

export type RecebimentoSemAlocacaoRecord = {
  preRecebimentoId: string;
  responsavelId: number;
  dataInicio: Date;
  unidadeId: string;
};

export async function listRecebimentosEmConferenciaSemAlocacaoDb(
  db: DrizzleClient,
): Promise<RecebimentoSemAlocacaoRecord[]> {
  const rows = await db
    .select({
      preRecebimentoId: recebimentos.preRecebimentoId,
      responsavelId: recebimentos.responsavelId,
      dataInicio: recebimentos.dataInicio,
      unidadeId: preRecebimentos.unidadeId,
    })
    .from(recebimentos)
    .innerJoin(
      preRecebimentos,
      eq(preRecebimentos.id, recebimentos.preRecebimentoId),
    )
    .leftJoin(
      recebimentoAlocacoes,
      and(
        eq(recebimentoAlocacoes.preRecebimentoId, recebimentos.preRecebimentoId),
        inArray(recebimentoAlocacoes.status, ['atribuida', 'iniciada']),
      ),
    )
    .where(
      and(
        eq(recebimentos.situacao, 'em_conferencia'),
        isNull(recebimentoAlocacoes.id),
      ),
    );

  return rows;
}
