import { and, eq } from 'drizzle-orm';

import {
  SYSTEM_DEPOSITOS,
  type Deposito,
} from '../../../domain/model/estoque/deposito.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { depositos } from '../providers/drizzle/config/migrations/schema.js';
import { mapDepositoRow } from './map-estoque.drizzle.js';
import { ensureMotivosBloqueioSistemaUnidadeDb } from './motivo-bloqueio-saldo.drizzle.js';

export async function ensureDepositosUnidadeDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<Deposito[]> {
  const existing = await db
    .select()
    .from(depositos)
    .where(eq(depositos.unidadeId, unidadeId));

  const existingCodes = new Set(existing.map((row) => row.codigo));
  const missing = SYSTEM_DEPOSITOS.filter(
    (item) => !existingCodes.has(item.codigo),
  );

  if (missing.length > 0) {
    await db.insert(depositos).values(
      missing.map((item) => ({
        unidadeId,
        codigo: item.codigo,
        nome: item.nome,
        finalidade: item.finalidade,
        permiteVenda: item.permiteVenda,
        permitePicking: item.permitePicking,
        exigeEndereco: item.exigeEndereco,
        contaDisponivel: item.contaDisponivel,
        sistema: true,
        ativo: true,
      })),
    );
  }

  const rows = await db
    .select()
    .from(depositos)
    .where(eq(depositos.unidadeId, unidadeId));

  await ensureMotivosBloqueioSistemaUnidadeDb(db, unidadeId);

  return rows.map(mapDepositoRow);
}

export async function findDepositoByCodigoDb(
  db: DrizzleClient,
  unidadeId: string,
  codigo: string,
): Promise<Deposito | null> {
  const [row] = await db
    .select()
    .from(depositos)
    .where(and(eq(depositos.unidadeId, unidadeId), eq(depositos.codigo, codigo)))
    .limit(1);

  return row ? mapDepositoRow(row) : null;
}

export async function listDepositosDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<Deposito[]> {
  const rows = await db
    .select()
    .from(depositos)
    .where(eq(depositos.unidadeId, unidadeId));

  return rows.map(mapDepositoRow);
}
