import { and, asc, eq } from 'drizzle-orm';

import type { ListPerfisTarifasFilter } from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { perfisTarifas } from '../providers/drizzle/config/migrations/schema.js';
import { loadFaixasByPerfilIdsDb } from './find-perfil-tarifa.drizzle.js';
import { mapPerfilTarifaRow } from './map-perfil-tarifa.drizzle.js';

export async function listPerfisTarifasDb(
  db: DrizzleClient,
  filter: ListPerfisTarifasFilter,
) {
  const conditions = [];

  if (filter.unidadeId) {
    conditions.push(eq(perfisTarifas.unidadeId, filter.unidadeId));
  }

  if (filter.tipoCarga) {
    conditions.push(eq(perfisTarifas.tipoCarga, filter.tipoCarga));
  }

  const whereClause =
    conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(perfisTarifas)
    .where(whereClause)
    .orderBy(asc(perfisTarifas.nome));

  const perfilIds = rows.map((row) => row.id);
  const faixasByPerfil = await loadFaixasByPerfilIdsDb(db, perfilIds);

  return rows.map((row) =>
    mapPerfilTarifaRow(row, faixasByPerfil.get(row.id) ?? []),
  );
}
