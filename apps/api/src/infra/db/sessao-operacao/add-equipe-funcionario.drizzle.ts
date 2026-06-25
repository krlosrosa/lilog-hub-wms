import { eq } from 'drizzle-orm';

import type { EquipeFuncionarioRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleExecutor } from '../providers/drizzle/drizzle.provider.js';
import {
  equipeFuncionarios,
  funcionarios,
} from '../providers/drizzle/config/migrations/schema.js';

export async function addEquipeFuncionarioDb(
  db: DrizzleExecutor,
  equipeId: string,
  funcionarioId: number,
): Promise<EquipeFuncionarioRecord> {
  const [record] = await db
    .insert(equipeFuncionarios)
    .values({
      equipeId,
      funcionarioId,
    })
    .returning();

  if (!record) {
    throw new Error('Failed to add funcionario to equipe');
  }

  const [funcionario] = await db
    .select({
      matricula: funcionarios.matricula,
      nome: funcionarios.nome,
      cargo: funcionarios.cargo,
    })
    .from(funcionarios)
    .where(eq(funcionarios.id, funcionarioId))
    .limit(1);

  if (!funcionario) {
    throw new Error('Funcionario not found after insert');
  }

  return {
    id: record.id,
    funcionarioId: record.funcionarioId,
    matricula: funcionario.matricula,
    nome: funcionario.nome,
    cargo: funcionario.cargo,
    vigenciaInicio: record.vigenciaInicio,
    vigenciaFim: record.vigenciaFim,
    createdAt: record.createdAt,
  };
}
