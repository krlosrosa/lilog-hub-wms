import { and, eq } from 'drizzle-orm';

import type { Deposito } from '../../../domain/model/estoque/deposito.model.js';
import type {
  CreateDepositoInput,
  UpdateDepositoInput,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { depositos } from '../providers/drizzle/config/migrations/schema.js';
import { mapDepositoRow } from './map-estoque.drizzle.js';

export async function findDepositoByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<Deposito | null> {
  const [row] = await db
    .select()
    .from(depositos)
    .where(eq(depositos.id, id))
    .limit(1);

  return row ? mapDepositoRow(row) : null;
}

export async function createDepositoDb(
  db: DrizzleClient,
  input: CreateDepositoInput,
): Promise<Deposito> {
  const [row] = await db
    .insert(depositos)
    .values({
      unidadeId: input.unidadeId,
      codigo: input.codigo.trim().toUpperCase(),
      nome: input.nome.trim(),
      finalidade: input.finalidade,
      permiteVenda: input.permiteVenda,
      permitePicking: input.permitePicking,
      exigeEndereco: input.exigeEndereco,
      contaDisponivel: input.contaDisponivel,
      sistema: false,
      ativo: true,
    })
    .returning();

  if (!row) {
    throw new Error('Falha ao criar depósito');
  }

  return mapDepositoRow(row);
}

export async function updateDepositoDb(
  db: DrizzleClient,
  id: string,
  data: UpdateDepositoInput,
): Promise<Deposito | null> {
  const patch: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.nome !== undefined) {
    patch.nome = data.nome.trim();
  }

  if (data.permiteVenda !== undefined) {
    patch.permiteVenda = data.permiteVenda;
  }

  if (data.permitePicking !== undefined) {
    patch.permitePicking = data.permitePicking;
  }

  if (data.exigeEndereco !== undefined) {
    patch.exigeEndereco = data.exigeEndereco;
  }

  if (data.contaDisponivel !== undefined) {
    patch.contaDisponivel = data.contaDisponivel;
  }

  if (data.ativo !== undefined) {
    patch.ativo = data.ativo;
  }

  const [row] = await db
    .update(depositos)
    .set(patch)
    .where(eq(depositos.id, id))
    .returning();

  return row ? mapDepositoRow(row) : null;
}

export async function findDepositoByCodigoUnidadeDb(
  db: DrizzleClient,
  unidadeId: string,
  codigo: string,
): Promise<Deposito | null> {
  const [row] = await db
    .select()
    .from(depositos)
    .where(
      and(
        eq(depositos.unidadeId, unidadeId),
        eq(depositos.codigo, codigo.trim().toUpperCase()),
      ),
    )
    .limit(1);

  return row ? mapDepositoRow(row) : null;
}
