import { and, asc, eq, inArray } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  perfisTarifas,
  perfisTarifasFaixasKm,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapFaixaKmRow,
  mapPerfilTarifaRow,
} from './map-perfil-tarifa.drizzle.js';

export async function loadFaixasByPerfilIdsDb(
  db: DrizzleClient,
  perfilIds: string[],
) {
  if (perfilIds.length === 0) {
    return new Map<string, ReturnType<typeof mapFaixaKmRow>[]>();
  }

  const rows = await db
    .select()
    .from(perfisTarifasFaixasKm)
    .where(inArray(perfisTarifasFaixasKm.perfilTarifaId, perfilIds))
    .orderBy(
      asc(perfisTarifasFaixasKm.perfilTarifaId),
      asc(perfisTarifasFaixasKm.kmInicial),
    );

  const grouped = new Map<string, ReturnType<typeof mapFaixaKmRow>[]>();

  for (const row of rows) {
    const mapped = mapFaixaKmRow(row);
    const current = grouped.get(row.perfilTarifaId) ?? [];
    current.push(mapped);
    grouped.set(row.perfilTarifaId, current);
  }

  return grouped;
}

export async function findPerfilTarifaByIdDb(db: DrizzleClient, id: string) {
  const [row] = await db
    .select()
    .from(perfisTarifas)
    .where(eq(perfisTarifas.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const faixas = await loadFaixasByPerfilIdsDb(db, [id]);

  return mapPerfilTarifaRow(row, faixas.get(id) ?? []);
}

export async function findPerfilTarifaByUnidadeAndRavexIdDb(
  db: DrizzleClient,
  unidadeId: string,
  idRavex: number,
) {
  const [row] = await db
    .select()
    .from(perfisTarifas)
    .where(
      and(
        eq(perfisTarifas.unidadeId, unidadeId),
        eq(perfisTarifas.idRavex, idRavex),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const faixas = await loadFaixasByPerfilIdsDb(db, [row.id]);

  return mapPerfilTarifaRow(row, faixas.get(row.id) ?? []);
}
