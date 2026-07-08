import { inArray, sql } from 'drizzle-orm';

import type { CreateProdutoEnderecoData } from '../../../domain/model/produto-endereco/produto-endereco.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { produtoEnderecos } from '../providers/drizzle/config/migrations/schema.js';

const BATCH_SIZE = 200;

function buildPairKey(produtoId: string, enderecoId: string): string {
  return `${produtoId}::${enderecoId}`;
}

export async function upsertBulkProdutoEnderecoDb(
  db: DrizzleClient,
  rows: CreateProdutoEnderecoData[],
): Promise<{ inserted: number; updated: number }> {
  if (rows.length === 0) {
    return { inserted: 0, updated: 0 };
  }

  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const enderecoIds = [...new Set(batch.map((row) => row.enderecoId))];

    const existingRows = await db
      .select({
        produtoId: produtoEnderecos.produtoId,
        enderecoId: produtoEnderecos.enderecoId,
      })
      .from(produtoEnderecos)
      .where(inArray(produtoEnderecos.enderecoId, enderecoIds));

    const batchKeys = new Set(
      batch.map((row) => buildPairKey(row.produtoId, row.enderecoId)),
    );

    const existingKeys = new Set(
      existingRows
        .filter((row) =>
          batchKeys.has(buildPairKey(row.produtoId, row.enderecoId)),
        )
        .map((row) => buildPairKey(row.produtoId, row.enderecoId)),
    );

    await db
      .insert(produtoEnderecos)
      .values(
        batch.map((row) => ({
          centroId: row.centroId,
          produtoId: row.produtoId,
          enderecoId: row.enderecoId,
          papel: row.papel,
          ordem: row.ordem,
          ativo: row.ativo,
        })),
      )
      .onConflictDoUpdate({
        target: [produtoEnderecos.produtoId, produtoEnderecos.enderecoId],
        set: {
          papel: sql`excluded.papel`,
          ordem: sql`excluded.ordem`,
          ativo: sql`excluded.ativo`,
          updatedAt: sql`now()`,
        },
      });

    for (const row of batch) {
      const key = buildPairKey(row.produtoId, row.enderecoId);
      if (existingKeys.has(key)) {
        updated += 1;
      } else {
        inserted += 1;
      }
    }
  }

  return { inserted, updated };
}
