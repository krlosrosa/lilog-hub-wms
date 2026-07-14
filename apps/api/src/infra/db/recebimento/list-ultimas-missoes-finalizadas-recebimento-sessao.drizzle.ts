import { and, eq, gte, inArray, isNotNull, isNull, max } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  preRecebimentos,
  recebimentoAlocacoes,
  recebimentos,
} from '../providers/drizzle/config/migrations/schema.js';

export type UltimaMissaoFinalizadaRecebimentoRecord = {
  funcionarioId: number;
  ultimaMissaoFinalizadaEm: Date;
};

function mergeUltimasMissoes(
  rows: UltimaMissaoFinalizadaRecebimentoRecord[],
): Map<number, Date> {
  const map = new Map<number, Date>();

  for (const row of rows) {
    const atual = map.get(row.funcionarioId);

    if (!atual || row.ultimaMissaoFinalizadaEm.getTime() > atual.getTime()) {
      map.set(row.funcionarioId, row.ultimaMissaoFinalizadaEm);
    }
  }

  return map;
}

export async function listUltimasMissoesFinalizadasRecebimentoSessaoDb(
  db: DrizzleClient,
  sessaoId: string,
  unidadeId: string,
  sessaoInicio: Date | null,
  funcionarioIds: number[],
): Promise<UltimaMissaoFinalizadaRecebimentoRecord[]> {
  if (funcionarioIds.length === 0) {
    return [];
  }

  const situacoesFinalizadas = ['conferido', 'finalizado'] as const;
  const filtroInicioSessao = sessaoInicio
    ? gte(recebimentos.dataFim, sessaoInicio)
    : undefined;

  const viaAlocacao = await db
    .select({
      funcionarioId: recebimentoAlocacoes.funcionarioId,
      ultimaMissaoFinalizadaEm: max(recebimentos.dataFim),
    })
    .from(recebimentos)
    .innerJoin(
      recebimentoAlocacoes,
      eq(recebimentoAlocacoes.preRecebimentoId, recebimentos.preRecebimentoId),
    )
    .where(
      and(
        eq(recebimentoAlocacoes.sessaoId, sessaoId),
        inArray(recebimentoAlocacoes.funcionarioId, funcionarioIds),
        inArray(recebimentos.situacao, [...situacoesFinalizadas]),
        isNotNull(recebimentos.dataFim),
        filtroInicioSessao,
      ),
    )
    .groupBy(recebimentoAlocacoes.funcionarioId);

  const viaResponsavelSemAlocacao = await db
    .select({
      funcionarioId: recebimentos.responsavelId,
      ultimaMissaoFinalizadaEm: max(recebimentos.dataFim),
    })
    .from(recebimentos)
    .innerJoin(
      preRecebimentos,
      eq(preRecebimentos.id, recebimentos.preRecebimentoId),
    )
    .leftJoin(
      recebimentoAlocacoes,
      eq(recebimentoAlocacoes.preRecebimentoId, recebimentos.preRecebimentoId),
    )
    .where(
      and(
        eq(preRecebimentos.unidadeId, unidadeId),
        inArray(recebimentos.responsavelId, funcionarioIds),
        inArray(recebimentos.situacao, [...situacoesFinalizadas]),
        isNotNull(recebimentos.dataFim),
        isNull(recebimentoAlocacoes.id),
        filtroInicioSessao,
      ),
    )
    .groupBy(recebimentos.responsavelId);

  const merged = mergeUltimasMissoes([
    ...viaAlocacao
      .filter((row) => row.ultimaMissaoFinalizadaEm != null)
      .map((row) => ({
        funcionarioId: row.funcionarioId,
        ultimaMissaoFinalizadaEm: row.ultimaMissaoFinalizadaEm!,
      })),
    ...viaResponsavelSemAlocacao
      .filter((row) => row.ultimaMissaoFinalizadaEm != null)
      .map((row) => ({
        funcionarioId: row.funcionarioId,
        ultimaMissaoFinalizadaEm: row.ultimaMissaoFinalizadaEm!,
      })),
  ]);

  return [...merged.entries()].map(([funcionarioId, ultimaMissaoFinalizadaEm]) => ({
    funcionarioId,
    ultimaMissaoFinalizadaEm,
  }));
}
