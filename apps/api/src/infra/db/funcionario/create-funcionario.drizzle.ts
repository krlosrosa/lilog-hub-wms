import type { CreateFuncionarioInput } from '../../../domain/model/funcionario/funcionario.model.js';
import type { FuncionarioRecord } from '../../../domain/repositories/funcionario/funcionario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/migrations/schema.js';
import { mapFuncionarioRow } from './map-funcionario.drizzle.js';

export async function createFuncionarioDb(
  db: DrizzleClient,
  data: CreateFuncionarioInput,
): Promise<FuncionarioRecord> {
  const [record] = await db
    .insert(funcionarios)
    .values({
      unidadeId: data.unidadeId,
      matricula: data.matricula,
      nome: data.nome,
      cargo: data.cargo,
      situacao: data.situacao,
      dataAdmissao: data.dataAdmissao.toISOString().slice(0, 10),
      telefone: data.telefone ?? null,
      email: data.email ?? null,
      observacao: data.observacao ?? null,
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create funcionario');
  }

  return mapFuncionarioRow(record);
}
