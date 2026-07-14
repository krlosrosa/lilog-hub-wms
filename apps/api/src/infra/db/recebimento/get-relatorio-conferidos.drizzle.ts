import { eq, sql } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  funcionarios,
  itensRecebimento,
  preRecebimentos,
  produtos,
  recebimentoAvarias,
  recebimentos,
} from '../providers/drizzle/config/migrations/schema.js';

export type RelatorioConferidoItemRecord = {
  produtoId: string;
  sku: string;
  descricao: string;
  tipo: string;
  unidadesPorCaixa: number;
  pesoBrutoCaixa: number | null;
  loteRecebido: string | null;
  quantidadeRecebida: number;
  unidadeMedida: string;
  pesoRecebido: number | null;
  conferenteId: number;
  conferenteMatricula: string;
  conferenteNome: string;
};

export type RelatorioConferidoAvariaRecord = {
  produtoId: string | null;
  lote: string | null;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
};

export type RelatorioConferidoDataRecord = {
  recebimentoId: string;
  situacao: string;
  numeroTransporte: string | null;
  conferenteId: number;
  conferenteMatricula: string;
  conferenteNome: string;
  itens: RelatorioConferidoItemRecord[];
  avarias: RelatorioConferidoAvariaRecord[];
};

function parseNumeric(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getRelatorioConferidosDb(
  db: DrizzleClient,
  recebimentoId: string,
): Promise<RelatorioConferidoDataRecord | null> {
  const recebimentoRows = await db
    .select({
      recebimentoId: recebimentos.id,
      situacao: recebimentos.situacao,
      numeroTransporte: preRecebimentos.numeroTransporte,
      conferenteId: funcionarios.id,
      conferenteMatricula: funcionarios.matricula,
      conferenteNome: funcionarios.nome,
    })
    .from(recebimentos)
    .innerJoin(
      preRecebimentos,
      eq(recebimentos.preRecebimentoId, preRecebimentos.id),
    )
    .innerJoin(funcionarios, eq(recebimentos.responsavelId, funcionarios.id))
    .where(eq(recebimentos.id, recebimentoId))
    .limit(1);

  const recebimento = recebimentoRows[0];

  if (!recebimento) {
    return null;
  }

  const itemRows = await db
    .select({
      produtoId: itensRecebimento.produtoId,
      sku: produtos.sku,
      descricao: produtos.descricao,
      tipo: produtos.tipo,
      unidadesPorCaixa: produtos.unidadesPorCaixa,
      pesoBrutoCaixa: produtos.pesoBrutoCaixa,
      loteRecebido: itensRecebimento.loteRecebido,
      quantidadeRecebida: itensRecebimento.quantidadeRecebida,
      unidadeMedida: itensRecebimento.unidadeMedida,
      pesoRecebido: itensRecebimento.pesoRecebido,
      conferenteId: funcionarios.id,
      conferenteMatricula: funcionarios.matricula,
      conferenteNome: funcionarios.nome,
    })
    .from(itensRecebimento)
    .innerJoin(produtos, eq(itensRecebimento.produtoId, produtos.produtoId))
    .innerJoin(recebimentos, eq(recebimentos.id, itensRecebimento.recebimentoId))
    .innerJoin(
      funcionarios,
      eq(
        funcionarios.id,
        sql`coalesce(${itensRecebimento.conferidoPorId}, ${recebimentos.responsavelId})`,
      ),
    )
    .where(eq(itensRecebimento.recebimentoId, recebimentoId));

  const avariaRows = await db
    .select({
      produtoId: recebimentoAvarias.produtoId,
      lote: recebimentoAvarias.lote,
      quantidadeCaixas: recebimentoAvarias.quantidadeCaixas,
      quantidadeUnidades: recebimentoAvarias.quantidadeUnidades,
    })
    .from(recebimentoAvarias)
    .where(eq(recebimentoAvarias.recebimentoId, recebimentoId));

  return {
    recebimentoId: recebimento.recebimentoId,
    situacao: recebimento.situacao,
    numeroTransporte: recebimento.numeroTransporte,
    conferenteId: recebimento.conferenteId,
    conferenteMatricula: recebimento.conferenteMatricula,
    conferenteNome: recebimento.conferenteNome,
    itens: itemRows.map((row) => ({
      produtoId: row.produtoId,
      sku: row.sku,
      descricao: row.descricao,
      tipo: row.tipo,
      unidadesPorCaixa: row.unidadesPorCaixa ?? 1,
      pesoBrutoCaixa:
        row.pesoBrutoCaixa === null ? null : parseNumeric(row.pesoBrutoCaixa),
      loteRecebido: row.loteRecebido,
      quantidadeRecebida: parseNumeric(row.quantidadeRecebida),
      unidadeMedida: row.unidadeMedida,
      pesoRecebido:
        row.pesoRecebido === null ? null : parseNumeric(row.pesoRecebido),
      conferenteId: row.conferenteId,
      conferenteMatricula: row.conferenteMatricula,
      conferenteNome: row.conferenteNome,
    })),
    avarias: avariaRows.map((row) => ({
      produtoId: row.produtoId,
      lote: row.lote,
      quantidadeCaixas: row.quantidadeCaixas ?? 0,
      quantidadeUnidades: row.quantidadeUnidades ?? 0,
    })),
  };
}
