import { and, asc, eq, isNull } from 'drizzle-orm';

import type { DemandaSeparacaoDetalheRecord } from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { demandasSeparacao, mapaGrupos } from '../providers/drizzle/config/migrations/schema.js';
import { findDemandaDetalheByIdDb } from './demanda-separacao.drizzle.js';

export async function finalizarDemandaSeparacaoDb(
  db: DrizzleClient,
  demandaId: string,
): Promise<DemandaSeparacaoDetalheRecord | null> {
  const now = new Date();

  return db.transaction(async (tx) => {
    const atual = await tx
      .select({
        id: demandasSeparacao.id,
        mapaGrupoId: demandasSeparacao.mapaGrupoId,
        sessaoFuncionarioId: demandasSeparacao.sessaoFuncionarioId,
        sessaoId: demandasSeparacao.sessaoId,
        status: demandasSeparacao.status,
      })
      .from(demandasSeparacao)
      .where(eq(demandasSeparacao.id, demandaId))
      .limit(1);

    const demanda = atual[0];
    if (!demanda || demanda.status !== 'em_andamento') {
      return null;
    }

    await tx
      .update(demandasSeparacao)
      .set({
        status: 'concluida',
        finalizadoEm: now,
        updatedAt: now,
      })
      .where(eq(demandasSeparacao.id, demandaId));

    await tx
      .update(mapaGrupos)
      .set({ finalizadoEm: now })
      .where(eq(mapaGrupos.id, demanda.mapaGrupoId));

    const proximas = await tx
      .select({ id: demandasSeparacao.id, mapaGrupoId: demandasSeparacao.mapaGrupoId })
      .from(demandasSeparacao)
      .where(
        and(
          eq(demandasSeparacao.sessaoFuncionarioId, demanda.sessaoFuncionarioId),
          eq(demandasSeparacao.sessaoId, demanda.sessaoId),
          eq(demandasSeparacao.status, 'pendente'),
        ),
      )
      .orderBy(asc(demandasSeparacao.atribuidoEm))
      .limit(1);

    const proxima = proximas[0];
    if (proxima) {
      await tx
        .update(demandasSeparacao)
        .set({
          status: 'em_andamento',
          iniciadoEm: now,
          updatedAt: now,
        })
        .where(eq(demandasSeparacao.id, proxima.id));

      await tx
        .update(mapaGrupos)
        .set({
          iniciadoEm: now,
          sessaoFuncionarioId: demanda.sessaoFuncionarioId,
        })
        .where(
          and(
            eq(mapaGrupos.id, proxima.mapaGrupoId),
            isNull(mapaGrupos.iniciadoEm),
          ),
        );
    }

    return findDemandaDetalheByIdDb(tx, demandaId);
  });
}
