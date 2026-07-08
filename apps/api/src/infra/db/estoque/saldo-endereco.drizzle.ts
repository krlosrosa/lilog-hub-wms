import { and, eq, inArray } from 'drizzle-orm';

import type { ListSaldosEnderecoFilter } from '../../../domain/repositories/estoque/estoque.repository.js';
import type { SaldoEnderecoComProduto } from '../../../domain/repositories/estoque/estoque.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  depositos,
  enderecos,
  motivosBloqueioSaldo,
  produtos,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapSaldoEnderecoRow } from './map-estoque.drizzle.js';

export async function listSaldosEnderecoDb(
  db: DrizzleClient,
  filter: ListSaldosEnderecoFilter,
): Promise<SaldoEnderecoComProduto[]> {
  const conditions = [eq(saldosEndereco.unidadeId, filter.unidadeId)];

  if (filter.depositoId) {
    conditions.push(eq(saldosEndereco.depositoId, filter.depositoId));
  }

  if (filter.enderecoId) {
    conditions.push(eq(saldosEndereco.enderecoId, filter.enderecoId));
  }

  if (filter.enderecoIds && filter.enderecoIds.length > 0) {
    conditions.push(inArray(saldosEndereco.enderecoId, filter.enderecoIds));
  }

  if (filter.produtoId) {
    conditions.push(eq(saldosEndereco.produtoId, filter.produtoId));
  }

  if (filter.lote?.trim()) {
    conditions.push(eq(saldosEndereco.lote, filter.lote.trim()));
  }

  if (filter.status) {
    conditions.push(eq(saldosEndereco.status, filter.status));
  }

  if (filter.natureza) {
    conditions.push(eq(saldosEndereco.natureza, filter.natureza));
  }

  const rows = await db
    .select({
      saldo: saldosEndereco,
      endereco: enderecos,
      motivo: motivosBloqueioSaldo,
      produtoSku: produtos.sku,
      produtoNome: produtos.descricao,
      produtoGrupo: produtos.grupo,
      unidadesPorCaixa: produtos.unidadesPorCaixa,
      depositoCodigo: depositos.codigo,
      depositoNome: depositos.nome,
    })
    .from(saldosEndereco)
    .innerJoin(enderecos, eq(saldosEndereco.enderecoId, enderecos.id))
    .innerJoin(produtos, eq(saldosEndereco.produtoId, produtos.produtoId))
    .innerJoin(depositos, eq(saldosEndereco.depositoId, depositos.id))
    .leftJoin(
      motivosBloqueioSaldo,
      eq(saldosEndereco.motivoBloqueioId, motivosBloqueioSaldo.id),
    )
    .where(and(...conditions));

  return rows.map((row) => ({
    ...mapSaldoEnderecoRow(row.saldo, {
      enderecoMascarado: row.endereco.enderecoMascarado,
      motivo: row.motivo,
    }),
    produtoSku: row.produtoSku,
    produtoNome: row.produtoNome,
    produtoGrupo: row.produtoGrupo?.trim() || null,
    depositoCodigo: row.depositoCodigo,
    depositoNome: row.depositoNome,
    unidadesPorCaixa: row.unidadesPorCaixa,
  }));
}
