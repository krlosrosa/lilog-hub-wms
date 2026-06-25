import { and, eq, notInArray } from 'drizzle-orm';

import type {
  SyncPlacasTransportadoraInput,
  SyncPlacasTransportadoraResult,
} from '../../../domain/repositories/placa-transportadora/placa-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { transportadoraPlacas } from '../providers/drizzle/config/migrations/schema.js';
import { mapPlacaTransportadoraRow } from './map-placa-transportadora.drizzle.js';

function toInsertValues(
  transportadoraId: string,
  placa: SyncPlacasTransportadoraInput['placas'][number],
) {
  return {
    transportadoraId,
    idRavexVeiculo: placa.idRavexVeiculo,
    placa: placa.placa,
    tipoVeiculoIdRavex: placa.tipoVeiculoIdRavex,
    tipoVeiculoNome: placa.tipoVeiculoNome,
    peso: placa.peso,
    cubagem: placa.cubagem,
    tara: placa.tara,
    estrangeiro: placa.estrangeiro,
    updatedAt: new Date(),
  };
}

export async function syncPlacasTransportadoraDb(
  db: DrizzleClient,
  data: SyncPlacasTransportadoraInput,
): Promise<SyncPlacasTransportadoraResult> {
  const existingRows = await db
    .select()
    .from(transportadoraPlacas)
    .where(eq(transportadoraPlacas.transportadoraId, data.transportadoraId));

  const existingByRavexId = new Map(
    existingRows.map((row) => [row.idRavexVeiculo, row]),
  );

  const ravexIds = data.placas.map((placa) => placa.idRavexVeiculo);

  let inseridas = 0;
  let atualizadas = 0;

  if (data.placas.length > 0) {
    for (const placa of data.placas) {
      const existing = existingByRavexId.get(placa.idRavexVeiculo);
      const values = toInsertValues(data.transportadoraId, placa);

      if (existing) {
        const hasChanges =
          existing.placa !== values.placa ||
          existing.tipoVeiculoIdRavex !== values.tipoVeiculoIdRavex ||
          existing.tipoVeiculoNome !== values.tipoVeiculoNome ||
          existing.peso !== values.peso ||
          existing.cubagem !== values.cubagem ||
          existing.tara !== values.tara ||
          existing.estrangeiro !== values.estrangeiro;

        if (hasChanges) {
          await db
            .update(transportadoraPlacas)
            .set(values)
            .where(eq(transportadoraPlacas.id, existing.id));
          atualizadas += 1;
        }
      } else {
        await db.insert(transportadoraPlacas).values(values);
        inseridas += 1;
      }
    }
  }

  let removidas = 0;

  if (ravexIds.length === 0) {
    const deleted = await db
      .delete(transportadoraPlacas)
      .where(eq(transportadoraPlacas.transportadoraId, data.transportadoraId))
      .returning({ id: transportadoraPlacas.id });

    removidas = deleted.length;
  } else {
    const deleted = await db
      .delete(transportadoraPlacas)
      .where(
        and(
          eq(transportadoraPlacas.transportadoraId, data.transportadoraId),
          notInArray(transportadoraPlacas.idRavexVeiculo, ravexIds),
        ),
      )
      .returning({ id: transportadoraPlacas.id });

    removidas = deleted.length;
  }

  const items = await db
    .select()
    .from(transportadoraPlacas)
    .where(eq(transportadoraPlacas.transportadoraId, data.transportadoraId))
    .orderBy(transportadoraPlacas.placa);

  return {
    items: items.map((row) => mapPlacaTransportadoraRow(row)),
    total: items.length,
    inseridas,
    atualizadas,
    removidas,
  };
}
