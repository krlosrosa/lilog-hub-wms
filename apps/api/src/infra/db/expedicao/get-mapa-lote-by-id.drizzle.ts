import { and, eq } from 'drizzle-orm';

import type { MapaLoteRecord } from '../../../domain/repositories/expedicao/mapa-lote.repository.js';
import type { GerarMapasConfigInput } from '../../../application/dtos/expedicao/gerar-mapas.dto.js';
import type { MapaLoteResumo } from '../../../application/dtos/expedicao/salvar-mapas.dto.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { mapaLotes } from '../providers/drizzle/config/migrations/schema.js';

function mapMapaLoteRecord(row: typeof mapaLotes.$inferSelect): MapaLoteRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    config: row.config as GerarMapasConfigInput,
    payload: row.payload as MapaLoteRecord['payload'],
    resumo: row.resumo as MapaLoteResumo,
    configuracaoImpressaoId: row.configuracaoImpressaoId,
    templatesHtml: row.templatesHtml,
    criadoPor: row.criadoPor,
    createdAt: row.createdAt,
  };
}

export async function getMapaLoteByIdDb(
  db: DrizzleClient,
  id: string,
  unidadeId: string,
): Promise<MapaLoteRecord | null> {
  const [row] = await db
    .select()
    .from(mapaLotes)
    .where(and(eq(mapaLotes.id, id), eq(mapaLotes.unidadeId, unidadeId)))
    .limit(1);

  return row ? mapMapaLoteRecord(row) : null;
}
