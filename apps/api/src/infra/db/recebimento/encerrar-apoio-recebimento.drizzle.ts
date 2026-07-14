import { and, eq, inArray } from 'drizzle-orm';

import type { RecebimentoAlocacaoRecord } from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { recebimentoAlocacoes } from '../providers/drizzle/config/migrations/schema.js';
import {
  ALOCACAO_RECEBIMENTO_RETURNING,
  mapAlocacaoRecebimentoRow,
} from './map-alocacao-recebimento.drizzle.js';

export async function encerrarApoioRecebimentoDb(
  db: DrizzleClient,
  id: string,
  funcionarioId: number,
): Promise<RecebimentoAlocacaoRecord> {
  const [existing] = await db
    .select({
      status: recebimentoAlocacoes.status,
      papel: recebimentoAlocacoes.papel,
      funcionarioId: recebimentoAlocacoes.funcionarioId,
    })
    .from(recebimentoAlocacoes)
    .where(eq(recebimentoAlocacoes.id, id))
    .limit(1);

  if (!existing) {
    throw new Error('Apoio não encontrado');
  }

  if (existing.papel !== 'apoio') {
    throw new Error('Registro informado não é um apoio');
  }

  if (existing.funcionarioId !== funcionarioId) {
    throw new Error('Somente o operador de apoio pode encerrar esta participação');
  }

  if (!['atribuida', 'iniciada'].includes(existing.status)) {
    throw new Error('Só é possível encerrar apoios ativos');
  }

  const [updated] = await db
    .update(recebimentoAlocacoes)
    .set({ status: 'encerrada', encerradoEm: new Date() })
    .where(
      and(
        eq(recebimentoAlocacoes.id, id),
        eq(recebimentoAlocacoes.papel, 'apoio'),
        eq(recebimentoAlocacoes.funcionarioId, funcionarioId),
        inArray(recebimentoAlocacoes.status, ['atribuida', 'iniciada']),
      ),
    )
    .returning(ALOCACAO_RECEBIMENTO_RETURNING);

  if (!updated) {
    throw new Error('Falha ao encerrar apoio');
  }

  return mapAlocacaoRecebimentoRow(updated);
}
