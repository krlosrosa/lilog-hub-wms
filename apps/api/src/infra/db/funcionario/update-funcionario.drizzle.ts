import { eq } from 'drizzle-orm';

import type { UpdateFuncionarioInput } from '../../../domain/model/funcionario/funcionario.model.js';
import type { FuncionarioRecord } from '../../../domain/repositories/funcionario/funcionario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/migrations/schema.js';
import { mapFuncionarioRow } from './map-funcionario.drizzle.js';

export async function updateFuncionarioDb(
  db: DrizzleClient,
  id: number,
  data: UpdateFuncionarioInput,
): Promise<FuncionarioRecord | null> {
  const values: Partial<typeof funcionarios.$inferInsert> = {};

  if (data.unidadeId !== undefined) values.unidadeId = data.unidadeId;
  if (data.matricula !== undefined) values.matricula = data.matricula;
  if (data.nome !== undefined) values.nome = data.nome;
  if (data.cargo !== undefined) values.cargo = data.cargo;
  if (data.situacao !== undefined) values.situacao = data.situacao;
  if (data.dataAdmissao !== undefined) {
    values.dataAdmissao = data.dataAdmissao.toISOString().slice(0, 10);
  }
  if (data.telefone !== undefined) values.telefone = data.telefone;
  if (data.email !== undefined) values.email = data.email;
  if (data.observacao !== undefined) values.observacao = data.observacao;

  const [record] = await db
    .update(funcionarios)
    .set(values)
    .where(eq(funcionarios.id, id))
    .returning();

  return record ? mapFuncionarioRow(record) : null;
}
