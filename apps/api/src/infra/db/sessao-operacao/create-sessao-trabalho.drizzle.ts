import { eq } from 'drizzle-orm';

import type { CreateSessaoInput } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import type { SessaoRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import { resolveJanelaPlanejada } from '../../../domain/services/sessao-operacao/janela-turno.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipeFuncionarios,
  sessaoFuncionarios,
  sessoesTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';
import { findEscalaByIdDb } from './find-escala.drizzle.js';
import { findSessaoByIdDb } from './find-sessao-trabalho.drizzle.js';

function formatHorarioFromDb(value: string): string {
  return value.slice(0, 5);
}

export async function createSessaoTrabalhoDb(
  db: DrizzleClient,
  input: CreateSessaoInput,
): Promise<SessaoRecord> {
  const escala = await findEscalaByIdDb(db, input.escalaId);

  if (!escala) {
    throw new Error('Escala não encontrada');
  }

  if (!escala.ativo) {
    throw new Error('Escala inativa');
  }

  const { inicioPlanejado, fimPlanejado } = resolveJanelaPlanejada({
    dataReferencia: input.dataReferencia,
    horaInicio: formatHorarioFromDb(escala.horaInicioPlanejada),
    horaFim: formatHorarioFromDb(escala.horaFimPlanejada),
    cruzaMeiaNoite: escala.cruzaMeiaNoite,
  });

  return db.transaction(async (tx) => {
    const [sessao] = await tx
      .insert(sessoesTrabalho)
      .values({
        unidadeId: escala.unidadeId,
        escalaId: escala.id,
        equipeId: escala.equipeId,
        dataReferencia: input.dataReferencia,
        inicioPlanejado,
        fimPlanejado,
        status: 'planejada',
      })
      .returning({ id: sessoesTrabalho.id });

    if (!sessao) {
      throw new Error('Failed to create sessao');
    }

    const membros = await tx
      .select({ funcionarioId: equipeFuncionarios.funcionarioId })
      .from(equipeFuncionarios)
      .where(eq(equipeFuncionarios.equipeId, escala.equipeId));

    if (membros.length > 0) {
      await tx.insert(sessaoFuncionarios).values(
        membros.map((membro) => ({
          sessaoId: sessao.id,
          funcionarioId: membro.funcionarioId,
          status: 'esperado' as const,
        })),
      );
    }

    const created = await findSessaoByIdDb(tx, sessao.id);
    if (!created) {
      throw new Error('Failed to load created sessao');
    }

    return created;
  });
}
