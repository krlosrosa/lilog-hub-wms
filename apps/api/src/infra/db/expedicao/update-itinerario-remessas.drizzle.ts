import { and, eq, inArray, sql } from 'drizzle-orm';

import type {
  AtualizarItinerarioInput,
  AtualizarItinerarioRecord,
} from '../../../domain/repositories/expedicao/upload-lote.repository.js';
import { normalizarItinerarioCodigo } from '../../../shared/utils/normalizar-itinerario-codigo.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  remessas,
  uploadLotes,
} from '../providers/drizzle/config/migrations/schema.js';
import { findOrCreateItinerariosDb } from '../transporte/find-or-create-itinerarios.drizzle.js';

export async function updateItinerarioRemessasDb(
  db: DrizzleClient,
  input: AtualizarItinerarioInput,
): Promise<AtualizarItinerarioRecord> {
  if (input.itinerarios.length === 0) {
    return { atualizados: 0, naoEncontrados: 0 };
  }

  const [lote] = await db
    .select({ unidadeId: uploadLotes.unidadeId })
    .from(uploadLotes)
    .where(eq(uploadLotes.id, input.uploadLoteId))
    .limit(1);

  if (!lote) {
    return { atualizados: 0, naoEncontrados: input.itinerarios.length };
  }

  const porRemessa = new Map<string, string>();

  for (const item of input.itinerarios) {
    const remessa = item.remessa.trim();
    const itinerario = item.itinerario.trim();

    if (remessa && itinerario) {
      porRemessa.set(remessa, itinerario);
    }
  }

  const remessasChaves = [...porRemessa.keys()];

  if (remessasChaves.length === 0) {
    return { atualizados: 0, naoEncontrados: 0 };
  }

  const existentes = await db
    .select({ id: remessas.id, remessa: remessas.remessa })
    .from(remessas)
    .where(
      and(
        eq(remessas.uploadLoteId, input.uploadLoteId),
        inArray(remessas.remessa, remessasChaves),
      ),
    );

  const existentesPorRemessa = new Map(
    existentes.map((row) => [row.remessa, row.id]),
  );

  const codigosItinerario = [...new Set(porRemessa.values())];
  const itinerariosRecords = await findOrCreateItinerariosDb(
    db,
    lote.unidadeId,
    codigosItinerario,
  );
  const itinerarioIdPorCodigo = new Map(
    itinerariosRecords.map((record) => [record.codigo, record.id]),
  );

  const atualizacoes: {
    id: string;
    itinerario: string;
    itinerarioId: string | null;
  }[] = [];

  for (const [remessa, itinerarioRaw] of porRemessa) {
    const id = existentesPorRemessa.get(remessa);

    if (!id) {
      continue;
    }

    const itinerarioCodigo = normalizarItinerarioCodigo(itinerarioRaw);

    atualizacoes.push({
      id,
      itinerario: itinerarioCodigo,
      itinerarioId: itinerarioIdPorCodigo.get(itinerarioCodigo) ?? null,
    });
  }

  const naoEncontrados = remessasChaves.length - atualizacoes.length;

  if (atualizacoes.length === 0) {
    return { atualizados: 0, naoEncontrados };
  }

  await db.transaction(async (tx) => {
    const valueRows = atualizacoes.map(
      (item) =>
        sql`(${item.id}::uuid, ${item.itinerario}, ${item.itinerarioId}::uuid)`,
    );

    await tx.execute(sql`
      UPDATE ${remessas} AS r
      SET
        itinerario = v.itinerario,
        itinerario_id = v.itinerario_id
      FROM (
        VALUES ${sql.join(valueRows, sql`, `)}
      ) AS v(id, itinerario, itinerario_id)
      WHERE r.id = v.id
        AND r.upload_lote_id = ${input.uploadLoteId}::uuid
    `);
  });

  return {
    atualizados: atualizacoes.length,
    naoEncontrados,
  };
}
