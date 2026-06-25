import { and, desc, eq, inArray } from 'drizzle-orm';

import type { MapaLoteListItem } from '../../../domain/repositories/expedicao/mapa-lote.repository.js';
import type { MapaLoteResumo } from '../../../application/dtos/expedicao/salvar-mapas.dto.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  mapaLoteTransportes,
  mapaLotes,
} from '../providers/drizzle/config/migrations/schema.js';

export async function listMapasLotesByTransporteIdsDb(
  db: DrizzleClient,
  unidadeId: string,
  transporteIds: string[],
): Promise<MapaLoteListItem[]> {
  if (transporteIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: mapaLotes.id,
      unidadeId: mapaLotes.unidadeId,
      resumo: mapaLotes.resumo,
      configuracaoImpressaoId: mapaLotes.configuracaoImpressaoId,
      criadoPor: mapaLotes.criadoPor,
      createdAt: mapaLotes.createdAt,
      transporteId: mapaLoteTransportes.transporteId,
    })
    .from(mapaLotes)
    .innerJoin(
      mapaLoteTransportes,
      eq(mapaLoteTransportes.mapaLoteId, mapaLotes.id),
    )
    .where(
      and(
        eq(mapaLotes.unidadeId, unidadeId),
        inArray(mapaLoteTransportes.transporteId, transporteIds),
      ),
    )
    .orderBy(desc(mapaLotes.createdAt));

  const lotesPorId = new Map<string, MapaLoteListItem>();

  rows.forEach((row) => {
    const atual = lotesPorId.get(row.id) ?? {
      id: row.id,
      unidadeId: row.unidadeId,
      resumo: row.resumo as MapaLoteResumo,
      configuracaoImpressaoId: row.configuracaoImpressaoId,
      criadoPor: row.criadoPor,
      createdAt: row.createdAt,
      transporteIds: [],
    };

    if (!atual.transporteIds.includes(row.transporteId)) {
      atual.transporteIds.push(row.transporteId);
    }

    lotesPorId.set(row.id, atual);
  });

  return Array.from(lotesPorId.values());
}
