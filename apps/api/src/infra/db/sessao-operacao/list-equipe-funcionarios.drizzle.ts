import { eq } from 'drizzle-orm';

import type { EquipeFuncionarioRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipeFuncionarios,
  funcionarios,
} from '../providers/drizzle/config/migrations/schema.js';

function mapEquipeFuncionarioRow(row: {
  id: string;
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  createdAt: Date;
}): EquipeFuncionarioRecord {
  return {
    id: row.id,
    funcionarioId: row.funcionarioId,
    matricula: row.matricula,
    nome: row.nome,
    cargo: row.cargo,
    vigenciaInicio: row.vigenciaInicio,
    vigenciaFim: row.vigenciaFim,
    createdAt: row.createdAt,
  };
}

export async function listEquipeFuncionariosDb(
  db: DrizzleClient,
  equipeId: string,
): Promise<EquipeFuncionarioRecord[]> {
  const rows = await db
    .select({
      id: equipeFuncionarios.id,
      funcionarioId: equipeFuncionarios.funcionarioId,
      matricula: funcionarios.matricula,
      nome: funcionarios.nome,
      cargo: funcionarios.cargo,
      vigenciaInicio: equipeFuncionarios.vigenciaInicio,
      vigenciaFim: equipeFuncionarios.vigenciaFim,
      createdAt: equipeFuncionarios.createdAt,
    })
    .from(equipeFuncionarios)
    .innerJoin(
      funcionarios,
      eq(equipeFuncionarios.funcionarioId, funcionarios.id),
    )
    .where(eq(equipeFuncionarios.equipeId, equipeId))
    .orderBy(funcionarios.nome);

  return rows.map(mapEquipeFuncionarioRow);
}
