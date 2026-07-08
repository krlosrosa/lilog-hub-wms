import { and, eq, inArray, isNotNull, ne } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasArmazenagem,
  itensArmazenagem,
  tarefasArmazenagem,
} from '../providers/drizzle/config/migrations/schema.js';

export type ListEnderecosSugeridosReservadosFilter = {
  unidadeId: string;
  excludeItemId?: string;
  excludeTarefaId?: string;
};

export async function listEnderecosSugeridosReservadosArmazenagemDb(
  db: DrizzleClient,
  filter: ListEnderecosSugeridosReservadosFilter,
): Promise<string[]> {
  const demandaStatuses = ['aguardando_inicio', 'em_andamento'] as const;
  const reservados = new Set<string>();

  const itemConditions = [
    eq(demandasArmazenagem.unidadeId, filter.unidadeId),
    inArray(demandasArmazenagem.status, [...demandaStatuses]),
    isNotNull(itensArmazenagem.enderecoSugeridoId),
  ];

  if (filter.excludeItemId) {
    itemConditions.push(ne(itensArmazenagem.id, filter.excludeItemId));
  }

  const itemRows = await db
    .selectDistinct({ enderecoId: itensArmazenagem.enderecoSugeridoId })
    .from(itensArmazenagem)
    .innerJoin(
      demandasArmazenagem,
      eq(itensArmazenagem.demandaId, demandasArmazenagem.id),
    )
    .where(and(...itemConditions));

  for (const row of itemRows) {
    if (row.enderecoId) {
      reservados.add(row.enderecoId);
    }
  }

  const tarefaConditions = [
    eq(demandasArmazenagem.unidadeId, filter.unidadeId),
    inArray(demandasArmazenagem.status, [...demandaStatuses]),
    isNotNull(tarefasArmazenagem.enderecoSugeridoId),
  ];

  if (filter.excludeTarefaId) {
    tarefaConditions.push(ne(tarefasArmazenagem.id, filter.excludeTarefaId));
  }

  const tarefaRows = await db
    .selectDistinct({ enderecoId: tarefasArmazenagem.enderecoSugeridoId })
    .from(tarefasArmazenagem)
    .innerJoin(
      demandasArmazenagem,
      eq(tarefasArmazenagem.demandaId, demandasArmazenagem.id),
    )
    .where(and(...tarefaConditions));

  for (const row of tarefaRows) {
    if (row.enderecoId) {
      reservados.add(row.enderecoId);
    }
  }

  return [...reservados];
}
