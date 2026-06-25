import type { EquipeFuncionarioRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { addEquipeFuncionarioDb } from './add-equipe-funcionario.drizzle.js';

export async function addEquipeFuncionariosDb(
  db: DrizzleClient,
  equipeId: string,
  funcionarioIds: number[],
): Promise<EquipeFuncionarioRecord[]> {
  const uniqueIds = [...new Set(funcionarioIds)];

  return db.transaction(async (tx) => {
    const added: EquipeFuncionarioRecord[] = [];

    for (const funcionarioId of uniqueIds) {
      const record = await addEquipeFuncionarioDb(tx, equipeId, funcionarioId);
      added.push(record);
    }

    return added;
  });
}
