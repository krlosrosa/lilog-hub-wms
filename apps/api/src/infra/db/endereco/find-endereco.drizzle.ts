import { and, eq, or, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  demandaEnderecos,
  enderecos,
  movementRecords,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapEnderecoRow } from './map-endereco.drizzle.js';

export async function findEnderecoByIdDb(db: DrizzleClient, id: string) {
  const rows = await db
    .select({
      endereco: enderecos,
      centro: centros,
    })
    .from(enderecos)
    .innerJoin(centros, eq(enderecos.centroId, centros.id))
    .where(eq(enderecos.id, id))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return mapEnderecoRow(row.endereco, row.centro);
}

export async function findEnderecoByCentroAndCodigoDb(
  db: DrizzleClient,
  centroId: string,
  enderecoMascarado: string,
) {
  const rows = await db
    .select({
      endereco: enderecos,
      centro: centros,
    })
    .from(enderecos)
    .innerJoin(centros, eq(enderecos.centroId, centros.id))
    .where(
      and(
        eq(enderecos.centroId, centroId),
        eq(enderecos.enderecoMascarado, enderecoMascarado.trim().toUpperCase()),
      ),
    )
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return mapEnderecoRow(row.endereco, row.centro);
}

export async function hasEnderecoStockDb(db: DrizzleClient, id: string) {
  const [row] = await db
    .select({
      status: enderecos.status,
      ocupacaoPercent: enderecos.ocupacaoPercent,
    })
    .from(enderecos)
    .where(eq(enderecos.id, id))
    .limit(1);

  if (!row) {
    return false;
  }

  return (
    row.status === 'ocupado' || Number(row.ocupacaoPercent ?? 0) > 0
  );
}

export async function hasEnderecoMovementHistoryDb(
  db: DrizzleClient,
  id: string,
) {
  const endereco = await findEnderecoByIdDb(db, id);

  if (!endereco) {
    return false;
  }

  const [movement] = await db
    .select({ id: movementRecords.id })
    .from(movementRecords)
    .where(
      or(
        eq(movementRecords.fromLocation, endereco.enderecoMascarado),
        eq(movementRecords.toLocation, endereco.enderecoMascarado),
      ),
    )
    .limit(1);

  if (movement) {
    return true;
  }

  const [demanda] = await db
    .select({ id: demandaEnderecos.id })
    .from(demandaEnderecos)
    .where(eq(demandaEnderecos.enderecoId, id))
    .limit(1);

  return Boolean(demanda);
}
