import { and, asc, eq, sql } from 'drizzle-orm';

import type { MapaOperacionalRow } from '../../../../domain/repositories/expedicao/torre-controle.repository.js';
import type { DrizzleClient } from '../../providers/drizzle/drizzle.provider.js';
import {
  funcionarios,
  mapaGrupos,
  sessaoFuncionarios,
  transportes,
} from '../../providers/drizzle/config/migrations/schema.js';

export type ListarMapasOperacionaisTorreInput = {
  unidadeId: string;
  uploadLoteId: string;
};

export async function listarMapasOperacionaisTorreDb(
  db: DrizzleClient,
  input: ListarMapasOperacionaisTorreInput,
): Promise<MapaOperacionalRow[]> {
  const rows = await db
    .select({
      mapaGrupoId: mapaGrupos.id,
      transporteId: mapaGrupos.transporteId,
      transporteCodigo: transportes.rota,
      processo: mapaGrupos.processo,
      titulo: mapaGrupos.titulo,
      sequencia: mapaGrupos.sequencia,
      iniciadoEm: mapaGrupos.iniciadoEm,
      finalizadoEm: mapaGrupos.finalizadoEm,
      tempoParadoSeg: sql<number>`CASE
        WHEN ${mapaGrupos.finalizadoEm} IS NOT NULL THEN 0
        ELSE GREATEST(
          0,
          EXTRACT(EPOCH FROM (NOW() - COALESCE(${mapaGrupos.iniciadoEm}, ${mapaGrupos.createdAt})))
        )::integer
      END`.as('tempo_parado_seg'),
      operadorNome: funcionarios.nome,
      prioridade: sql<boolean>`(${transportes.isPrioridade} OR ${transportes.reentregaExclusiva})`.as(
        'prioridade',
      ),
    })
    .from(mapaGrupos)
    .innerJoin(transportes, eq(mapaGrupos.transporteId, transportes.id))
    .leftJoin(
      sessaoFuncionarios,
      eq(mapaGrupos.sessaoFuncionarioId, sessaoFuncionarios.id),
    )
    .leftJoin(funcionarios, eq(sessaoFuncionarios.funcionarioId, funcionarios.id))
    .where(
      and(
        eq(transportes.unidadeId, input.unidadeId),
        eq(transportes.uploadLoteId, input.uploadLoteId),
      ),
    )
    .orderBy(asc(mapaGrupos.processo), asc(mapaGrupos.sequencia));

  return rows.map((row) => ({
    ...row,
    processo: row.processo as MapaOperacionalRow['processo'],
  }));
}
