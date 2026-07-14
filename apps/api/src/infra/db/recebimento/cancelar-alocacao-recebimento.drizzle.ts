import { and, eq } from 'drizzle-orm';

import type { RecebimentoAlocacaoRecord } from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { recebimentoAlocacoes } from '../providers/drizzle/config/migrations/schema.js';

import {
  ALOCACAO_RECEBIMENTO_RETURNING,
  mapAlocacaoRecebimentoRow,
} from './map-alocacao-recebimento.drizzle.js';

export async function cancelarAlocacaoRecebimentoDb(
  db: DrizzleClient,
  id: string,
): Promise<RecebimentoAlocacaoRecord> {
  const [existing] = await db
    .select({
      status: recebimentoAlocacoes.status,
      papel: recebimentoAlocacoes.papel,
    })
    .from(recebimentoAlocacoes)
    .where(eq(recebimentoAlocacoes.id, id))
    .limit(1);

  if (!existing) {
    throw new Error('Alocação não encontrada');
  }

  if (existing.papel !== 'responsavel') {
    throw new Error('Use o endpoint de remoção de apoio para este registro');
  }

  if (existing.status !== 'atribuida') {
    throw new Error(
      'Só é possível cancelar alocações com status "atribuida"',
    );
  }

  const [updated] = await db
    .update(recebimentoAlocacoes)
    .set({ status: 'cancelada', canceladoEm: new Date() })
    .where(
      and(
        eq(recebimentoAlocacoes.id, id),
        eq(recebimentoAlocacoes.status, 'atribuida'),
      ),
    )
    .returning(ALOCACAO_RECEBIMENTO_RETURNING);

  if (!updated) {
    throw new Error('Falha ao cancelar alocação');
  }

  return mapAlocacaoRecebimentoRow(updated);
}
