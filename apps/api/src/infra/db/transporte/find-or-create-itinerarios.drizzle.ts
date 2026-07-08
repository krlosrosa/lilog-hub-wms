import { and, eq, inArray } from 'drizzle-orm';

import { sanitizarItinerariosInput } from '../../../shared/utils/normalizar-itinerario-codigo.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { itinerarios } from '../providers/drizzle/config/migrations/schema.js';

type DbExecutor = Pick<DrizzleClient, 'insert' | 'select'>;

export async function findOrCreateItinerariosDb(
  db: DbExecutor,
  unidadeId: string,
  codigosInput: string[] | undefined,
): Promise<{ id: string; codigo: string }[]> {
  const codigos = sanitizarItinerariosInput(codigosInput);

  if (codigos.length === 0) {
    return [];
  }

  await db
    .insert(itinerarios)
    .values(codigos.map((codigo) => ({ unidadeId, codigo })))
    .onConflictDoNothing({
      target: [itinerarios.unidadeId, itinerarios.codigo],
    });

  const rows = await db
    .select({ id: itinerarios.id, codigo: itinerarios.codigo })
    .from(itinerarios)
    .where(
      and(
        eq(itinerarios.unidadeId, unidadeId),
        inArray(itinerarios.codigo, codigos),
      ),
    );

  return rows.sort((a, b) => a.codigo.localeCompare(b.codigo, 'pt-BR'));
}

export async function findItinerarioByCodigoDb(
  db: DbExecutor,
  unidadeId: string,
  codigoInput: string,
): Promise<{ id: string; codigo: string } | null> {
  const [row] = await findOrCreateItinerariosDb(db, unidadeId, [codigoInput]);

  return row ?? null;
}
