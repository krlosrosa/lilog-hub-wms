import { eq, inArray } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  itensPreRecebimento,
  itensRecebimento,
  preRecebimentos,
  produtos,
  recebimentoAvarias,
  recebimentos,
} from '../providers/drizzle/config/migrations/schema.js';

export type MovimentacaoConferidoRecord = {
  preRecebimentoId: string;
  recebimentoId: string;
  produtoId: string;
  sku: string;
  empresa: string;
  tipo: string;
  unidadesPorCaixa: number;
  pesoBrutoCaixa: number | null;
  loteRecebido: string | null;
  quantidadeRecebida: number;
  unidadeMedida: string;
  pesoRecebido: number | null;
  validade: Date | null;
};

export type MovimentacaoEsperadoRecord = {
  preRecebimentoId: string;
  produtoId: string;
  quantidadeEsperada: number;
  unidadeMedida: string;
  pesoEsperado: number | null;
  loteEsperado: string | null;
  validadeEsperada: Date | null;
};

export type MovimentacaoAvariaRecord = {
  recebimentoId: string;
  produtoId: string | null;
  lote: string | null;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
};

export type MovimentacaoDataRecord = {
  unidadeId: string;
  conferidos: MovimentacaoConferidoRecord[];
  esperados: MovimentacaoEsperadoRecord[];
  avarias: MovimentacaoAvariaRecord[];
};

function parseNumeric(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getItensMovimentacaoDb(
  db: DrizzleClient,
  preRecebimentoIds: string[],
): Promise<MovimentacaoDataRecord> {
  if (preRecebimentoIds.length === 0) {
    return { unidadeId: '', conferidos: [], esperados: [], avarias: [] };
  }

  const preRecebimentoRows = await db
    .select({ unidadeId: preRecebimentos.unidadeId })
    .from(preRecebimentos)
    .where(inArray(preRecebimentos.id, preRecebimentoIds))
    .limit(1);

  const unidadeId = preRecebimentoRows[0]?.unidadeId ?? '';

  const recebimentoRows = await db
    .select({
      id: recebimentos.id,
      preRecebimentoId: recebimentos.preRecebimentoId,
    })
    .from(recebimentos)
    .where(inArray(recebimentos.preRecebimentoId, preRecebimentoIds));

  const recebimentoIds = recebimentoRows.map((row) => row.id);
  const preRecebimentoPorRecebimento = new Map(
    recebimentoRows.map((row) => [row.id, row.preRecebimentoId]),
  );

  const esperadoRows = await db
    .select({
      preRecebimentoId: itensPreRecebimento.preRecebimentoId,
      produtoId: itensPreRecebimento.produtoId,
      quantidadeEsperada: itensPreRecebimento.quantidadeEsperada,
      unidadeMedida: itensPreRecebimento.unidadeMedida,
      pesoEsperado: itensPreRecebimento.pesoEsperado,
      loteEsperado: itensPreRecebimento.loteEsperado,
      validadeEsperada: itensPreRecebimento.validadeEsperada,
    })
    .from(itensPreRecebimento)
    .where(inArray(itensPreRecebimento.preRecebimentoId, preRecebimentoIds));

  const esperados: MovimentacaoEsperadoRecord[] = esperadoRows.map((row) => ({
    preRecebimentoId: row.preRecebimentoId,
    produtoId: row.produtoId,
    quantidadeEsperada: parseNumeric(row.quantidadeEsperada),
    unidadeMedida: row.unidadeMedida,
    pesoEsperado:
      row.pesoEsperado === null ? null : parseNumeric(row.pesoEsperado),
    loteEsperado: row.loteEsperado,
    validadeEsperada: row.validadeEsperada,
  }));

  if (recebimentoIds.length === 0) {
    return { unidadeId, conferidos: [], esperados, avarias: [] };
  }

  const conferidoRows = await db
    .select({
      recebimentoId: itensRecebimento.recebimentoId,
      produtoId: itensRecebimento.produtoId,
      sku: produtos.sku,
      empresa: produtos.empresa,
      tipo: produtos.tipo,
      unidadesPorCaixa: produtos.unidadesPorCaixa,
      pesoBrutoCaixa: produtos.pesoBrutoCaixa,
      loteRecebido: itensRecebimento.loteRecebido,
      quantidadeRecebida: itensRecebimento.quantidadeRecebida,
      unidadeMedida: itensRecebimento.unidadeMedida,
      pesoRecebido: itensRecebimento.pesoRecebido,
      validade: itensRecebimento.validade,
    })
    .from(itensRecebimento)
    .innerJoin(produtos, eq(itensRecebimento.produtoId, produtos.produtoId))
    .where(inArray(itensRecebimento.recebimentoId, recebimentoIds));

  const conferidos: MovimentacaoConferidoRecord[] = conferidoRows
    .map((row) => {
      const preRecebimentoId = preRecebimentoPorRecebimento.get(row.recebimentoId);

      if (!preRecebimentoId) {
        return null;
      }

      return {
        preRecebimentoId,
        recebimentoId: row.recebimentoId,
        produtoId: row.produtoId,
        sku: row.sku,
        empresa: row.empresa,
        tipo: row.tipo,
        unidadesPorCaixa: row.unidadesPorCaixa ?? 1,
        pesoBrutoCaixa:
          row.pesoBrutoCaixa === null
            ? null
            : parseNumeric(row.pesoBrutoCaixa),
        loteRecebido: row.loteRecebido,
        quantidadeRecebida: parseNumeric(row.quantidadeRecebida),
        unidadeMedida: row.unidadeMedida,
        pesoRecebido:
          row.pesoRecebido === null ? null : parseNumeric(row.pesoRecebido),
        validade: row.validade,
      };
    })
    .filter((row): row is MovimentacaoConferidoRecord => row !== null);

  const avariaRows = await db
    .select({
      recebimentoId: recebimentoAvarias.recebimentoId,
      produtoId: recebimentoAvarias.produtoId,
      lote: recebimentoAvarias.lote,
      quantidadeCaixas: recebimentoAvarias.quantidadeCaixas,
      quantidadeUnidades: recebimentoAvarias.quantidadeUnidades,
    })
    .from(recebimentoAvarias)
    .where(inArray(recebimentoAvarias.recebimentoId, recebimentoIds));

  const avarias: MovimentacaoAvariaRecord[] = avariaRows.map((row) => ({
    recebimentoId: row.recebimentoId,
    produtoId: row.produtoId,
    lote: row.lote,
    quantidadeCaixas: row.quantidadeCaixas ?? 0,
    quantidadeUnidades: row.quantidadeUnidades ?? 0,
  }));

  return { unidadeId, conferidos, esperados, avarias };
}
