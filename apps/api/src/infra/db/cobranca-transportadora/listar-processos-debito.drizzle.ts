import { and, count, desc, eq, inArray } from 'drizzle-orm';

import type {
  ListarProcessosFilter,
  ProcessoDebitoListItem,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  processoDebitoItens,
  processosDebito,
} from '../providers/drizzle/config/migrations/schema.js';

type TipoContagem = {
  falta: number;
  avaria: number;
};

function buildContagemPorProcesso(
  rows: {
    processoDebitoId: string;
    tipo: 'falta' | 'avaria' | 'sobra';
    total: number;
  }[],
): Map<string, TipoContagem> {
  const map = new Map<string, TipoContagem>();

  for (const row of rows) {
    const atual = map.get(row.processoDebitoId) ?? { falta: 0, avaria: 0 };

    if (row.tipo === 'falta') {
      atual.falta = row.total;
    } else {
      atual.avaria = row.total;
    }

    map.set(row.processoDebitoId, atual);
  }

  return map;
}

export async function listarProcessosDebitoDb(
  db: DrizzleClient,
  filter: ListarProcessosFilter,
): Promise<ProcessoDebitoListItem[]> {
  const conditions = [eq(processosDebito.unidadeId, filter.unidadeId)];

  if (filter.status) {
    conditions.push(eq(processosDebito.status, filter.status));
  }

  if (filter.transportadoraId) {
    conditions.push(
      eq(processosDebito.transportadoraId, filter.transportadoraId),
    );
  }

  if (filter.demandaId) {
    conditions.push(eq(processosDebito.demandaId, filter.demandaId));
  }

  const rows = await db
    .select({
      id: processosDebito.id,
      unidadeId: processosDebito.unidadeId,
      demandaId: processosDebito.demandaId,
      codigoDemanda: demandasDevolucao.codigoDemanda,
      transporteId: processosDebito.transporteId,
      transportadoraId: processosDebito.transportadoraId,
      transportadoraNome: processosDebito.transportadoraNome,
      status: processosDebito.status,
      valorTotal: processosDebito.valorTotal,
      quantidadeItens: processosDebito.quantidadeItens,
      createdAt: processosDebito.createdAt,
      updatedAt: processosDebito.updatedAt,
    })
    .from(processosDebito)
    .innerJoin(
      demandasDevolucao,
      eq(processosDebito.demandaId, demandasDevolucao.id),
    )
    .where(and(...conditions))
    .orderBy(desc(processosDebito.createdAt));

  if (rows.length === 0) {
    return [];
  }

  const processoIds = rows.map((row) => row.id);

  const contagemRows = await db
    .select({
      processoDebitoId: processoDebitoItens.processoDebitoId,
      tipo: processoDebitoItens.tipo,
      total: count(),
    })
    .from(processoDebitoItens)
    .where(inArray(processoDebitoItens.processoDebitoId, processoIds))
    .groupBy(processoDebitoItens.processoDebitoId, processoDebitoItens.tipo);

  const contagemPorProcesso = buildContagemPorProcesso(
    contagemRows.map((row) => ({
      processoDebitoId: row.processoDebitoId,
      tipo: row.tipo,
      total: Number(row.total),
    })),
  );

  return rows.map((row) => {
    const contagem = contagemPorProcesso.get(row.id) ?? { falta: 0, avaria: 0 };

    return {
      id: row.id,
      unidadeId: row.unidadeId,
      demandaId: row.demandaId,
      codigoDemanda: row.codigoDemanda,
      transporteId: row.transporteId,
      transportadoraId: row.transportadoraId,
      transportadoraNome: row.transportadoraNome,
      status: row.status,
      valorTotal: Number(row.valorTotal),
      quantidadeItens: row.quantidadeItens,
      quantidadeItensFalta: contagem.falta,
      quantidadeItensAvaria: contagem.avaria,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });
}
