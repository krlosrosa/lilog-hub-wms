import { and, eq, inArray, isNotNull, ne } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasArmazenagem,
  itensArmazenagem,
} from '../providers/drizzle/config/migrations/schema.js';

export type ListEnderecosSugeridosReservadosFilter = {
  unidadeId: string;
  excludeItemId?: string;
};

export async function listEnderecosSugeridosReservadosArmazenagemDb(
  db: DrizzleClient,
  filter: ListEnderecosSugeridosReservadosFilter,
): Promise<string[]> {
  const conditions = [
    eq(demandasArmazenagem.unidadeId, filter.unidadeId),
    inArray(demandasArmazenagem.status, [
      'aguardando_inicio',
      'em_andamento',
    ]),
    isNotNull(itensArmazenagem.enderecoSugeridoId),
  ];

  if (filter.excludeItemId) {
    conditions.push(ne(itensArmazenagem.id, filter.excludeItemId));
  }

  const rows = await db
    .selectDistinct({ enderecoId: itensArmazenagem.enderecoSugeridoId })
    .from(itensArmazenagem)
    .innerJoin(
      demandasArmazenagem,
      eq(itensArmazenagem.demandaId, demandasArmazenagem.id),
    )
    .where(and(...conditions));

  return rows
    .map((row) => row.enderecoId)
    .filter((id): id is string => id !== null);
}
