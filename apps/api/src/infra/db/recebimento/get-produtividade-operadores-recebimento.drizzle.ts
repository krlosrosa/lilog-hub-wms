import { and, eq, gte, lte, sql } from 'drizzle-orm';

import type {
  RecebimentoPainelFiltro,
  RecebimentoPainelProdutividadeOperadorRow,
} from '../../../domain/repositories/recebimento/recebimento-painel.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/schemas/auth.schema.js';
import {
  itensRecebimento,
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
  const conferenteIdExpr = sql<number>`coalesce(${itensRecebimento.conferidoPorId}, ${recebimentos.responsavelId})`;

  const [carrosRows, volumeRows] = await Promise.all([
    db
      .select({
        funcionarioId: recebimentos.responsavelId,
        nome: funcionarios.nome,
        cargo: funcionarios.cargo,
        carros: sql<number>`count(*)::int`,
        tempoMedioMinutos: sql<
          number | null
        >`avg(extract(epoch from (${recebimentos.dataFim} - ${recebimentos.dataInicio})) / 60)::float8`,
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
      ),
    db
      .select({
        funcionarioId: conferenteIdExpr,
        nome: funcionarios.nome,
        cargo: funcionarios.cargo,
        volumeUn: sql<number>`coalesce(sum(${itensRecebimento.quantidadeRecebida}), 0)::float8`,
      })
      .from(itensRecebimento)
      .innerJoin(recebimentos, eq(recebimentos.id, itensRecebimento.recebimentoId))
      .innerJoin(
        preRecebimentos,
        eq(preRecebimentos.id, recebimentos.preRecebimentoId),
      )
      .innerJoin(funcionarios, eq(funcionarios.id, conferenteIdExpr))
      .where(
        and(
          eq(preRecebimentos.unidadeId, filtro.unidadeId),
          eq(recebimentos.situacao, 'finalizado'),
          sql`${recebimentos.dataFim} is not null`,
          gte(recebimentos.dataFim, filtro.dataInicio),
          lte(recebimentos.dataFim, filtro.dataFim),
        ),
      )
      .groupBy(conferenteIdExpr, funcionarios.nome, funcionarios.cargo),
  ]);

  const merged = new Map<number, RecebimentoPainelProdutividadeOperadorRow>();

  for (const row of carrosRows) {
    merged.set(row.funcionarioId, {
      funcionarioId: row.funcionarioId,
      nome: row.nome,
      cargo: row.cargo,
      carros: row.carros ?? 0,
      tempoMedioMinutos:
        row.tempoMedioMinutos != null
          ? Math.round(parseNumeric(row.tempoMedioMinutos) * 10) / 10
          : null,
      volumeUn: 0,
    });
  }

  for (const row of volumeRows) {
    const existing = merged.get(row.funcionarioId);
    const volumeUn = Math.round(parseNumeric(row.volumeUn));

    if (existing) {
      existing.volumeUn = volumeUn;
      continue;
    }

    merged.set(row.funcionarioId, {
      funcionarioId: row.funcionarioId,
      nome: row.nome,
      cargo: row.cargo,
      carros: 0,
      tempoMedioMinutos: null,
      volumeUn,
    });
  }

  return [...merged.values()].sort((a, b) => {
    if (b.carros !== a.carros) {
      return b.carros - a.carros;
    }

    return b.volumeUn - a.volumeUn;
  });
}
