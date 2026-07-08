import { and, eq, inArray } from 'drizzle-orm';

import { DEVOLUCAO_NF_TIPOS_ELEGIVEIS_TRANSPORTE } from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoItens,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';

export type DevolucaoNfComItensRow = {
  id: string;
  numeroNf: string;
  tipo: 'reentrega' | 'devolucao_parcial' | 'devolucao_total';
  codCliente: string | null;
  cliente: string | null;
  motivo: string;
  transporteOrigemId: string | null;
  remessaId: string | null;
  itens: Array<{
    id: string;
    produtoId: string | null;
    sku: string;
    descricaoProduto: string | null;
    lote: string | null;
    dataFabricacao: string | null;
    quantidade: string;
    unidadeMedida: string;
    quantidadeNormalizadaUnidades: string;
    pesoDevolvido: string | null;
  }>;
};

export async function findDevolucaoNfsByIdsDb(
  db: DrizzleClient,
  input: {
    unidadeId: string;
    nfIds: string[];
  },
): Promise<DevolucaoNfComItensRow[]> {
  if (input.nfIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: devolucaoNotasFiscais.id,
      numeroNf: devolucaoNotasFiscais.numeroNf,
      tipo: devolucaoNotasFiscais.tipo,
      codCliente: devolucaoNotasFiscais.codCliente,
      cliente: devolucaoNotasFiscais.cliente,
      motivo: devolucaoNotasFiscais.motivo,
      transporteOrigemId: devolucaoNotasFiscais.transporteId,
      remessaId: devolucaoNotasFiscais.remessaId,
      itemId: devolucaoItens.id,
      produtoId: devolucaoItens.produtoId,
      sku: devolucaoItens.sku,
      descricaoProduto: devolucaoItens.descricaoProduto,
      lote: devolucaoItens.lote,
      dataFabricacao: devolucaoItens.dataFabricacao,
      quantidade: devolucaoItens.quantidade,
      unidadeMedida: devolucaoItens.unidadeMedida,
      quantidadeNormalizadaUnidades: devolucaoItens.quantidadeNormalizadaUnidades,
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
        eq(demandasDevolucao.unidadeId, input.unidadeId),
        inArray(devolucaoNotasFiscais.id, input.nfIds),
      ),
    );

  const grouped = new Map<string, DevolucaoNfComItensRow>();

  for (const row of rows) {
    const existing = grouped.get(row.id);

    if (!existing) {
      grouped.set(row.id, {
        id: row.id,
        numeroNf: row.numeroNf,
        tipo: row.tipo,
        codCliente: row.codCliente,
        cliente: row.cliente,
        motivo: row.motivo,
        transporteOrigemId: row.transporteOrigemId,
        remessaId: row.remessaId,
        itens: [],
      });
    }

    if (row.itemId && row.sku && row.quantidade && row.unidadeMedida && row.quantidadeNormalizadaUnidades) {
      grouped.get(row.id)!.itens.push({
        id: row.itemId,
        produtoId: row.produtoId,
        sku: row.sku,
        descricaoProduto: row.descricaoProduto,
        lote: row.lote,
        dataFabricacao: row.dataFabricacao,
        quantidade: row.quantidade,
        unidadeMedida: row.unidadeMedida,
        quantidadeNormalizadaUnidades: row.quantidadeNormalizadaUnidades,
        pesoDevolvido: row.pesoDevolvido,
      });
    }
  }

  return [...grouped.values()];
}

export async function findDevolucaoNfsElegiveisByIdsDb(
  db: DrizzleClient,
  input: {
    unidadeId: string;
    nfIds: string[];
  },
): Promise<DevolucaoNfComItensRow[]> {
  const notas = await findDevolucaoNfsByIdsDb(db, input);

  return notas.filter(
    (nota) =>
      DEVOLUCAO_NF_TIPOS_ELEGIVEIS_TRANSPORTE.includes(nota.tipo) &&
      nota.remessaId == null,
  );
}
