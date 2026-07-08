import { and, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';

import { DEVOLUCAO_NF_TIPOS_ELEGIVEIS_TRANSPORTE } from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoItens,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';

export type DevolucaoNfElegivelRow = {
  id: string;
  numeroNf: string;
  tipo: 'reentrega' | 'devolucao_parcial' | 'devolucao_total';
  codCliente: string | null;
  cliente: string | null;
  motivo: string;
  transporteOrigemId: string | null;
  pesoTotal: number;
  quantidadeItens: number;
};

export type FindNfsDevolucaoElegiveisFilter = {
  dataInicio: string;
  dataFim: string;
};

function normalizarIntervaloData(filter: FindNfsDevolucaoElegiveisFilter): {
  dataInicio: string;
  dataFim: string;
} {
  if (filter.dataInicio <= filter.dataFim) {
    return filter;
  }

  return {
    dataInicio: filter.dataFim,
    dataFim: filter.dataInicio,
  };
}

function limitesIntervaloUtcMenos3(dataInicio: string, dataFim: string): {
  inicio: Date;
  fim: Date;
} {
  return {
    inicio: new Date(`${dataInicio}T00:00:00-03:00`),
    fim: new Date(`${dataFim}T23:59:59.999-03:00`),
  };
}

export async function findNfsDevolucaoElegiveisDb(
  db: DrizzleClient,
  unidadeId: string,
  filter: FindNfsDevolucaoElegiveisFilter,
): Promise<DevolucaoNfElegivelRow[]> {
  const { dataInicio, dataFim } = normalizarIntervaloData(filter);
  const { inicio, fim } = limitesIntervaloUtcMenos3(dataInicio, dataFim);

  const rows = await db
    .select({
      id: devolucaoNotasFiscais.id,
      numeroNf: devolucaoNotasFiscais.numeroNf,
      tipo: devolucaoNotasFiscais.tipo,
      codCliente: devolucaoNotasFiscais.codCliente,
      cliente: devolucaoNotasFiscais.cliente,
      motivo: devolucaoNotasFiscais.motivo,
      transporteOrigemId: devolucaoNotasFiscais.transporteId,
      itemId: devolucaoItens.id,
      pesoDevolvido: devolucaoItens.pesoDevolvido,
    })
    .from(devolucaoNotasFiscais)
    .innerJoin(
      demandasDevolucao,
      eq(devolucaoNotasFiscais.demandaId, demandasDevolucao.id),
    )
    .leftJoin(
      devolucaoItens,
      eq(devolucaoItens.devolucaoNfId, devolucaoNotasFiscais.id),
    )
    .where(
      and(
        eq(demandasDevolucao.unidadeId, unidadeId),
        inArray(
          devolucaoNotasFiscais.tipo,
          DEVOLUCAO_NF_TIPOS_ELEGIVEIS_TRANSPORTE,
        ),
        isNull(devolucaoNotasFiscais.remessaId),
        gte(devolucaoNotasFiscais.createdAt, inicio),
        lte(devolucaoNotasFiscais.createdAt, fim),
      ),
    )
    .orderBy(desc(devolucaoNotasFiscais.createdAt));

  const grouped = new Map<string, DevolucaoNfElegivelRow>();

  for (const row of rows) {
    if (!grouped.has(row.id)) {
      grouped.set(row.id, {
        id: row.id,
        numeroNf: row.numeroNf,
        tipo: row.tipo,
        codCliente: row.codCliente,
        cliente: row.cliente,
        motivo: row.motivo,
        transporteOrigemId: row.transporteOrigemId,
        pesoTotal: 0,
        quantidadeItens: 0,
      });
    }

    const entry = grouped.get(row.id)!;

    if (row.pesoDevolvido != null || row.itemId != null) {
      entry.quantidadeItens += 1;
      if (row.pesoDevolvido != null) {
        entry.pesoTotal += Number(row.pesoDevolvido);
      }
    }
  }

  return [...grouped.values()];
}
