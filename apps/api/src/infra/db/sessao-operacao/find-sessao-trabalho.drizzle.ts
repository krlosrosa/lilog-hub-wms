import { eq, sql } from 'drizzle-orm';

import type { SessaoRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleExecutor } from '../providers/drizzle/drizzle.provider.js';
import {
  equipes,
  escalasTrabalho,
  sessaoFuncionarios,
  sessoesTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapSessaoRow } from './map-sessao.drizzle.js';

export async function findSessaoByIdDb(
  db: DrizzleExecutor,
  id: string,
): Promise<SessaoRecord | null> {
  const [row] = await db
    .select({
      id: sessoesTrabalho.id,
      unidadeId: sessoesTrabalho.unidadeId,
      escalaId: sessoesTrabalho.escalaId,
      equipeId: sessoesTrabalho.equipeId,
      dataReferencia: sessoesTrabalho.dataReferencia,
      inicioPlanejado: sessoesTrabalho.inicioPlanejado,
      fimPlanejado: sessoesTrabalho.fimPlanejado,
      inicioReal: sessoesTrabalho.inicioReal,
      fimReal: sessoesTrabalho.fimReal,
      status: sessoesTrabalho.status,
      abertaPorUserId: sessoesTrabalho.abertaPorUserId,
      encerradaPorUserId: sessoesTrabalho.encerradaPorUserId,
      createdAt: sessoesTrabalho.createdAt,
      updatedAt: sessoesTrabalho.updatedAt,
      escalaNome: escalasTrabalho.nome,
      equipeNome: equipes.nome,
      horaInicioPlanejada: escalasTrabalho.horaInicioPlanejada,
      horaFimPlanejada: escalasTrabalho.horaFimPlanejada,
      cruzaMeiaNoite: escalasTrabalho.cruzaMeiaNoite,
      totalFuncionarios: sql<number>`coalesce(count(${sessaoFuncionarios.id}), 0)`,
    })
    .from(sessoesTrabalho)
    .innerJoin(escalasTrabalho, eq(sessoesTrabalho.escalaId, escalasTrabalho.id))
    .innerJoin(equipes, eq(sessoesTrabalho.equipeId, equipes.id))
    .leftJoin(
      sessaoFuncionarios,
      eq(sessaoFuncionarios.sessaoId, sessoesTrabalho.id),
    )
    .where(eq(sessoesTrabalho.id, id))
    .groupBy(sessoesTrabalho.id, escalasTrabalho.id, equipes.id)
    .limit(1);

  return row ? mapSessaoRow(row) : null;
}
