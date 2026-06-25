import { eq, sql } from 'drizzle-orm';

import type { EscalaDetailRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleExecutor } from '../providers/drizzle/drizzle.provider.js';
import {
  equipeFuncionarios,
  equipes,
  escalasTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapEscalaDetailRow } from './map-escala.drizzle.js';

export async function findEscalaByIdDb(
  db: DrizzleExecutor,
  id: string,
): Promise<EscalaDetailRecord | null> {
  const [row] = await db
    .select({
      id: escalasTrabalho.id,
      unidadeId: escalasTrabalho.unidadeId,
      equipeId: escalasTrabalho.equipeId,
      nome: escalasTrabalho.nome,
      horaInicioPlanejada: escalasTrabalho.horaInicioPlanejada,
      horaFimPlanejada: escalasTrabalho.horaFimPlanejada,
      cruzaMeiaNoite: escalasTrabalho.cruzaMeiaNoite,
      ativo: escalasTrabalho.ativo,
      createdAt: escalasTrabalho.createdAt,
      updatedAt: escalasTrabalho.updatedAt,
      equipeNome: equipes.nome,
      equipeArea: equipes.area,
      totalFuncionarios: sql<number>`coalesce(count(${equipeFuncionarios.id}), 0)`,
    })
    .from(escalasTrabalho)
    .innerJoin(equipes, eq(escalasTrabalho.equipeId, equipes.id))
    .leftJoin(
      equipeFuncionarios,
      eq(equipeFuncionarios.equipeId, escalasTrabalho.equipeId),
    )
    .where(eq(escalasTrabalho.id, id))
    .groupBy(escalasTrabalho.id, equipes.id)
    .limit(1);

  return row ? mapEscalaDetailRow(row) : null;
}
