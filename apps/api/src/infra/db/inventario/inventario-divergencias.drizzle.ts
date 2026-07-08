import { and, desc, eq, inArray } from 'drizzle-orm';

import { calcularQuantidadeContadaUnidades } from '../../../application/services/inventario/calcular-quantidade-contagem.js';
import type {
  ContagemRecord,
  InventarioDivergenciaRecord,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  contagens,
  demandaEnderecos,
  demandasContagem,
  enderecos,
  produtos,
} from '../providers/drizzle/config/migrations/schema.js';
import { listSaldosEnderecoDb } from '../estoque/saldo-endereco.drizzle.js';
import { mapContagemRow } from './map-inventario.drizzle.js';

export async function listContagensValidacaoParaReconciliacaoDb(
  db: DrizzleClient,
  inventarioId: string,
) {
  const rows = await db
    .select({
      contagem: contagens,
      enderecoId: demandaEnderecos.enderecoId,
      unidadeId: enderecos.unidadeId,
    })
    .from(contagens)
    .innerJoin(
      demandaEnderecos,
      eq(contagens.demandaEnderecoId, demandaEnderecos.id),
    )
    .innerJoin(
      demandasContagem,
      eq(demandaEnderecos.demandaId, demandasContagem.id),
    )
    .innerJoin(enderecos, eq(demandaEnderecos.enderecoId, enderecos.id))
    .where(
      and(
        eq(demandasContagem.inventarioId, inventarioId),
        inArray(contagens.tipo, ['cega', 'validacao']),
      ),
    )
    .orderBy(desc(contagens.createdAt));

  return rows.map((row) => ({
    contagem: mapContagemRow(row.contagem),
    enderecoId: row.enderecoId,
    unidadeId: row.unidadeId,
  }));
}

function resolveSaldoReferencia(
  saldos: Awaited<ReturnType<typeof listSaldosEnderecoDb>>,
  contagem: ContagemRecord,
) {
  if (contagem.saldoEnderecoId) {
    const byId = saldos.find((item) => item.id === contagem.saldoEnderecoId);
    if (byId) {
      return byId;
    }
  }

  if (contagem.produtoId) {
    const byProduto = saldos.find(
      (item) => item.produtoId === contagem.produtoId,
    );
    if (byProduto) {
      return byProduto;
    }
  }

  if (contagem.lote?.trim()) {
    const byLote = saldos.find(
      (item) => item.lote.trim() === contagem.lote?.trim(),
    );
    if (byLote) {
      return byLote;
    }
  }

  if (saldos.length === 1) {
    return saldos[0] ?? null;
  }

  return null;
}

export async function listInventarioDivergenciasDb(
  db: DrizzleClient,
  inventarioId: string,
): Promise<InventarioDivergenciaRecord[]> {
  const rows = await db
    .select({
      contagem: contagens,
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
      enderecoId: demandaEnderecos.enderecoId,
      unidadeId: enderecos.unidadeId,
      produtoSku: produtos.sku,
      produtoNome: produtos.descricao,
      unidadesPorCaixa: produtos.unidadesPorCaixa,
    })
    .from(contagens)
    .innerJoin(
      demandaEnderecos,
      eq(contagens.demandaEnderecoId, demandaEnderecos.id),
    )
    .innerJoin(
      demandasContagem,
      eq(demandaEnderecos.demandaId, demandasContagem.id),
    )
    .innerJoin(enderecos, eq(demandaEnderecos.enderecoId, enderecos.id))
    .leftJoin(produtos, eq(contagens.produtoId, produtos.produtoId))
    .where(
      and(
        eq(demandasContagem.inventarioId, inventarioId),
        inArray(contagens.tipo, ['cega', 'validacao']),
      ),
    )
    .orderBy(desc(contagens.createdAt));

  if (rows.length === 0) {
    return [];
  }

  const unidadeId = rows[0]!.unidadeId;
  const enderecoIds = [...new Set(rows.map((row) => row.enderecoId))];
  const saldos = await listSaldosEnderecoDb(db, {
    unidadeId,
    enderecoIds,
    natureza: 'fisico',
  });

  const saldosPorEndereco = new Map<string, typeof saldos>();
  for (const saldo of saldos) {
    const current = saldosPorEndereco.get(saldo.enderecoId) ?? [];
    current.push(saldo);
    saldosPorEndereco.set(saldo.enderecoId, current);
  }

  const divergencias: InventarioDivergenciaRecord[] = [];

  for (const row of rows) {
    const contagem = mapContagemRow(row.contagem);

    if (contagem.anomaliaEncontrada) {
      divergencias.push({
        id: contagem.id,
        contagemId: contagem.id,
        enderecoMascarado: row.enderecoMascarado,
        zona: row.zona,
        produtoId: contagem.produtoId,
        sku: row.produtoSku ?? contagem.codigoProduto,
        produtoNome: row.produtoNome ?? '—',
        quantidadeEsperada: 0,
        quantidadeContada: calcularQuantidadeContadaUnidades(
          contagem.quantidadeCaixas,
          contagem.quantidadeUnidades,
          row.unidadesPorCaixa,
        ),
        diferenca: 0,
        tipo: 'falta',
        enderecoVazio: false,
        anomaliaEncontrada: true,
        pendenteAjuste: false,
      });
      continue;
    }

    const saldosEndereco = saldosPorEndereco.get(row.enderecoId) ?? [];
    const saldoReferencia = resolveSaldoReferencia(saldosEndereco, contagem);

    const quantidadeEsperada = saldoReferencia
      ? saldoReferencia.quantidade
      : 0;
    const quantidadeContada = contagem.enderecoVazio
      ? 0
      : calcularQuantidadeContadaUnidades(
          contagem.quantidadeCaixas,
          contagem.quantidadeUnidades,
          row.unidadesPorCaixa ?? saldoReferencia?.unidadesPorCaixa,
        );
    const diferenca = quantidadeContada - quantidadeEsperada;
    const isDivergencia =
      contagem.tipo === 'cega'
        ? contagem.enderecoVazio || diferenca !== 0
        : contagem.enderecoVazio ||
          !contagem.correspondeAoEsperado ||
          diferenca !== 0;

    if (!isDivergencia) {
      continue;
    }

    divergencias.push({
      id: contagem.id,
      contagemId: contagem.id,
      enderecoMascarado: row.enderecoMascarado,
      zona: row.zona,
      produtoId: contagem.produtoId ?? saldoReferencia?.produtoId ?? null,
      sku: row.produtoSku ?? saldoReferencia?.produtoSku ?? contagem.codigoProduto,
      produtoNome: row.produtoNome ?? saldoReferencia?.produtoNome ?? '—',
      quantidadeEsperada,
      quantidadeContada,
      diferenca,
      tipo: diferenca >= 0 ? 'sobra' : 'falta',
      enderecoVazio: contagem.enderecoVazio,
      anomaliaEncontrada: false,
      pendenteAjuste: true,
    });
  }

  return divergencias;
}
