import { and, eq } from 'drizzle-orm';

import { normalizarCodCliente } from '../../../domain/model/expedicao/cliente-especial.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { clientesEspeciais } from '../providers/drizzle/config/migrations/schema.js';
import { mapClienteEspecialRow } from './map-cliente-especial.drizzle.js';

export async function findClienteEspecialByUnidadeAndCodClienteDb(
  db: DrizzleClient,
  unidadeId: string,
  codCliente: string,
) {
  const rows = await db
    .select()
    .from(clientesEspeciais)
    .where(
      and(
        eq(clientesEspeciais.unidadeId, unidadeId),
        eq(clientesEspeciais.ativo, true),
      ),
    );

  const row = rows.find(
    (item) =>
      normalizarCodCliente(item.codCliente) === normalizarCodCliente(codCliente),
  );

  return row ? mapClienteEspecialRow(row) : null;
}

export async function findClientesEspeciaisPorCodigosDb(
  db: DrizzleClient,
  unidadeId: string,
  codClientes: string[],
) {
  if (!codClientes.length) {
    return [];
  }

  const codigosNormalizados = new Set(
    codClientes.map((codigo) => normalizarCodCliente(codigo)),
  );

  const rows = await db
    .select()
    .from(clientesEspeciais)
    .where(
      and(
        eq(clientesEspeciais.unidadeId, unidadeId),
        eq(clientesEspeciais.ativo, true),
      ),
    );

  return rows
    .filter((row) =>
      codigosNormalizados.has(normalizarCodCliente(row.codCliente)),
    )
    .map(mapClienteEspecialRow);
}
