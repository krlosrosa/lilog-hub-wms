import { and, eq } from 'drizzle-orm';

import type { UpdateSessaoFuncionarioPresencaInput } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import type { SessaoFuncionarioRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  funcionarios,
  sessaoFuncionarios,
} from '../providers/drizzle/config/migrations/schema.js';

export async function updateSessaoFuncionarioPresencaDb(
  db: DrizzleClient,
  sessaoId: string,
  funcionarioId: number,
  input: UpdateSessaoFuncionarioPresencaInput,
): Promise<SessaoFuncionarioRecord> {
  const now = new Date();
  const patch: Partial<typeof sessaoFuncionarios.$inferInsert> = {
    updatedAt: now,
  };

  if (input.status !== undefined) {
    patch.status = input.status;
  }

  if (input.checkIn !== undefined) {
    patch.checkIn =
      input.checkIn === null ? null : new Date(input.checkIn);
  }

  if (input.checkOut !== undefined) {
    patch.checkOut =
      input.checkOut === null ? null : new Date(input.checkOut);
  }

  if (input.observacao !== undefined) {
    patch.observacao = input.observacao;
  }

  const [updated] = await db
    .update(sessaoFuncionarios)
    .set(patch)
    .where(
      and(
        eq(sessaoFuncionarios.sessaoId, sessaoId),
        eq(sessaoFuncionarios.funcionarioId, funcionarioId),
      ),
    )
    .returning({ id: sessaoFuncionarios.id });

  if (!updated) {
    throw new Error('Funcionário não encontrado na sessão');
  }

  const [row] = await db
    .select({
      id: sessaoFuncionarios.id,
      funcionarioId: sessaoFuncionarios.funcionarioId,
      matricula: funcionarios.matricula,
      nome: funcionarios.nome,
      cargo: funcionarios.cargo,
      status: sessaoFuncionarios.status,
      checkIn: sessaoFuncionarios.checkIn,
      checkOut: sessaoFuncionarios.checkOut,
      observacao: sessaoFuncionarios.observacao,
      createdAt: sessaoFuncionarios.createdAt,
      updatedAt: sessaoFuncionarios.updatedAt,
    })
    .from(sessaoFuncionarios)
    .innerJoin(
      funcionarios,
      eq(sessaoFuncionarios.funcionarioId, funcionarios.id),
    )
    .where(eq(sessaoFuncionarios.id, updated.id))
    .limit(1);

  if (!row) {
    throw new Error('Failed to load updated sessao funcionario');
  }

  return {
    id: row.id,
    funcionarioId: row.funcionarioId,
    matricula: row.matricula,
    nome: row.nome,
    cargo: row.cargo,
    status: row.status,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    observacao: row.observacao,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
