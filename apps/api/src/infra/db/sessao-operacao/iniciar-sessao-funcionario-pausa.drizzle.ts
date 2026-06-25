import type { IniciarSessaoPausaInput } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import type { SessaoFuncionarioPausaRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { sessaoFuncionarioPausas } from '../providers/drizzle/config/migrations/schema.js';
import { mapSessaoPausaRow } from './map-sessao-pausa.drizzle.js';

export async function iniciarSessaoFuncionarioPausaDb(
  db: DrizzleClient,
  sessaoFuncionarioId: string,
  userId: number,
  input: IniciarSessaoPausaInput,
): Promise<SessaoFuncionarioPausaRecord> {
  const now = new Date();

  const [inserted] = await db
    .insert(sessaoFuncionarioPausas)
    .values({
      sessaoFuncionarioId,
      tipo: input.tipo,
      inicio: now,
      registradoPorUserId: userId,
      observacao: input.observacao ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (!inserted) {
    throw new Error('Failed to start sessao funcionario pausa');
  }

  return mapSessaoPausaRow(inserted);
}
