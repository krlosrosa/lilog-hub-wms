import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { recebimentoAvarias } from '../providers/drizzle/config/migrations/schema.js';

export async function listRecebimentoAvariasDb(
  db: DrizzleClient,
  recebimentoId: string,
) {
  const rows = await db
    .select()
    .from(recebimentoAvarias)
    .where(eq(recebimentoAvarias.recebimentoId, recebimentoId))
    .orderBy(recebimentoAvarias.createdAt);

  return rows.map((row) => ({
    id: row.id,
    recebimentoId: row.recebimentoId,
    produtoId: row.produtoId,
    tipo: row.tipo,
    natureza: row.natureza,
    causa: row.causa,
    quantidadeCaixas: row.quantidadeCaixas,
    quantidadeUnidades: row.quantidadeUnidades,
    lote: row.lote,
    validade: row.validade,
    numeroSerie: row.numeroSerie,
    photoCount: row.photoCount,
    replicado: row.replicado,
    clientDamageId: row.clientDamageId,
    operatorId: row.operatorId,
    createdAt: row.createdAt,
  }));
}
