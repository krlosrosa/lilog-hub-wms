import { and, eq, gte, lte, sql } from 'drizzle-orm';

import type {
  RecebimentoPainelFiltro,
  RecebimentoPainelProdutividadeOperadorRow,
} from '../../../domain/repositories/recebimento/recebimento-painel.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/schemas/auth.schema.js';
import {
  itensPreRecebimento,
  preRecebimentos,
  recebimentos,
} from '../providers/drizzle/config/schemas/recebimento.schema.js';

function parseNumeric(value: string | number | null | undefined): number {
  if (value == null) {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getProdutividadeOperadoresRecebimentoDb(
  db: DrizzleClient,
  filtro: RecebimentoPainelFiltro,
): Promise<RecebimentoPainelProdutividadeOperadorRow[]> {
  const rows = await db
    .select({
      funcionarioId: recebimentos.responsavelId,
      nome: funcionarios.nome,
      cargo: funcionarios.cargo,
      carros: sql<number>`count(*)::int`,
      tempoMedioMinutos: sql<
        number | null
      >`avg(extract(epoch from (${recebimentos.dataFim} - ${recebimentos.dataInicio})) / 60)::float8`,
      volumeUn: sql<number>`coalesce(sum((
        SELECT coalesce(sum(${itensPreRecebimento.quantidadeEsperada}), 0)::float8
        FROM recebimento.itens_pre_recebimento
        WHERE pre_recebimento_id = ${preRecebimentos.id}
      )), 0)::float8`,
    })
    .from(recebimentos)
    .innerJoin(
      preRecebimentos,
      eq(preRecebimentos.id, recebimentos.preRecebimentoId),
    )
    .innerJoin(funcionarios, eq(funcionarios.id, recebimentos.responsavelId))
    .where(
      and(
        eq(preRecebimentos.unidadeId, filtro.unidadeId),
        eq(recebimentos.situacao, 'finalizado'),
        sql`${recebimentos.dataFim} is not null`,
        gte(recebimentos.dataFim, filtro.dataInicio),
        lte(recebimentos.dataFim, filtro.dataFim),
      ),
    )
    .groupBy(
      recebimentos.responsavelId,
      funcionarios.nome,
      funcionarios.cargo,
    )
    .orderBy(sql`count(*) desc`);

  return rows.map((row) => ({
    funcionarioId: row.funcionarioId,
    nome: row.nome,
    cargo: row.cargo,
    carros: row.carros ?? 0,
    tempoMedioMinutos:
      row.tempoMedioMinutos != null
        ? Math.round(parseNumeric(row.tempoMedioMinutos) * 10) / 10
        : null,
    volumeUn: Math.round(parseNumeric(row.volumeUn)),
  }));
}
