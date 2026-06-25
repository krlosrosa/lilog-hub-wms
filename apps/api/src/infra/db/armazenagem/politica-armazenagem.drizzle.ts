import {
  DEFAULT_POLITICA_ARMAZENAGEM,
  type PoliticaArmazenagem,
} from '@lilog/contracts';
import { eq } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { politicaArmazenagem } from '../providers/drizzle/config/migrations/schema.js';

function mapRow(
  row: typeof politicaArmazenagem.$inferSelect,
): PoliticaArmazenagem {
  return {
    enderecoDivergente:
      row.enderecoDivergente as PoliticaArmazenagem['enderecoDivergente'],
    quantidadeParcial:
      row.quantidadeParcial as PoliticaArmazenagem['quantidadeParcial'],
    exigirBipagemProduto: row.exigirBipagemProduto,
    exigirBipagemEndereco: row.exigirBipagemEndereco,
    permitirOffline: row.permitirOffline,
    concluirAutomaticamenteDemanda: row.concluirAutomaticamente,
  };
}

export async function getPoliticaArmazenagemDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<PoliticaArmazenagem> {
  const [row] = await db
    .select()
    .from(politicaArmazenagem)
    .where(eq(politicaArmazenagem.unidadeId, unidadeId))
    .limit(1);

  if (!row) {
    return { ...DEFAULT_POLITICA_ARMAZENAGEM };
  }

  return mapRow(row);
}

export async function upsertPoliticaArmazenagemDb(
  db: DrizzleClient,
  unidadeId: string,
  data: PoliticaArmazenagem,
): Promise<PoliticaArmazenagem> {
  await db
    .insert(politicaArmazenagem)
    .values({
      unidadeId,
      enderecoDivergente: data.enderecoDivergente,
      quantidadeParcial: data.quantidadeParcial,
      exigirBipagemProduto: data.exigirBipagemProduto,
      exigirBipagemEndereco: data.exigirBipagemEndereco,
      permitirOffline: data.permitirOffline,
      concluirAutomaticamente: data.concluirAutomaticamenteDemanda,
    })
    .onConflictDoUpdate({
      target: politicaArmazenagem.unidadeId,
      set: {
        enderecoDivergente: data.enderecoDivergente,
        quantidadeParcial: data.quantidadeParcial,
        exigirBipagemProduto: data.exigirBipagemProduto,
        exigirBipagemEndereco: data.exigirBipagemEndereco,
        permitirOffline: data.permitirOffline,
        concluirAutomaticamente: data.concluirAutomaticamenteDemanda,
        updatedAt: new Date(),
      },
    });

  return getPoliticaArmazenagemDb(db, unidadeId);
}
