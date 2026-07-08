import { and, eq, inArray, sql } from 'drizzle-orm';

import type { SaldoEnderecoDetalhe } from '../../../domain/repositories/estoque/estoque.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  depositos,
  enderecos,
  motivosBloqueioSaldo,
  produtos,
  reservasEstoque,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapSaldoEnderecoRow, toQuantityNumber } from './map-estoque.drizzle.js';

const RESERVA_STATUS_ATIVOS = ['ativa', 'parcial'] as const;

export async function getSaldoEnderecoByIdDb(
  db: DrizzleClient,
  id: string,
): Promise<SaldoEnderecoDetalhe | null> {
  const [row] = await db
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
    .where(eq(saldosEndereco.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const [reservaRow] = await db
    .select({
      saldoReservado:
        sql<string>`coalesce(sum(${reservasEstoque.quantidade} - ${reservasEstoque.quantidadeAtendida}), 0)`.as(
          'saldo_reservado',
        ),
    })
    .from(reservasEstoque)
    .where(
      and(
        eq(reservasEstoque.unidadeId, row.saldo.unidadeId),
        eq(reservasEstoque.produtoId, row.saldo.produtoId),
        eq(reservasEstoque.depositoId, row.saldo.depositoId),
        eq(reservasEstoque.enderecoId, row.saldo.enderecoId),
        sql`coalesce(${reservasEstoque.lote}, '') = ${row.saldo.lote}`,
        sql`coalesce(${reservasEstoque.numeroSerie}, '') = ${row.saldo.numeroSerie}`,
        inArray(reservasEstoque.status, [...RESERVA_STATUS_ATIVOS]),
      ),
    );

  const mapped = mapSaldoEnderecoRow(row.saldo, {
    enderecoMascarado: row.endereco.enderecoMascarado,
    motivo: row.motivo,
  });

  return {
    ...mapped,
    produtoSku: row.produtoSku,
    produtoNome: row.produtoNome,
    produtoGrupo: row.produtoGrupo?.trim() || null,
    depositoCodigo: row.depositoCodigo,
    depositoNome: row.depositoNome,
    unidadesPorCaixa: row.unidadesPorCaixa,
    saldoReservado: toQuantityNumber(reservaRow?.saldoReservado ?? '0'),
  };
}
