import { eq, sql } from 'drizzle-orm';

import type { SaldoEndereco } from '../../../domain/model/estoque/saldo-endereco.model.js';
import type { AjustarSaldoEnderecoInput } from '../../../domain/repositories/estoque/estoque.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  motivosBloqueioSaldo,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapSaldoEnderecoRow,
  toQuantityString,
} from './map-estoque.drizzle.js';
import { registrarMovimentacaoEstoqueDb } from './registrar-movimentacao-estoque.drizzle.js';

async function loadSaldoWithMotivo(
  db: DrizzleClient,
  id: string,
): Promise<SaldoEndereco | null> {
  const [row] = await db
    .select({
      saldo: saldosEndereco,
      motivo: motivosBloqueioSaldo,
    })
    .from(saldosEndereco)
    .leftJoin(
      motivosBloqueioSaldo,
      eq(saldosEndereco.motivoBloqueioId, motivosBloqueioSaldo.id),
    )
    .where(eq(saldosEndereco.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  return mapSaldoEnderecoRow(row.saldo, { motivo: row.motivo });
}

export async function ajustarSaldoEnderecoDb(
  db: DrizzleClient,
  input: AjustarSaldoEnderecoInput,
): Promise<SaldoEndereco> {
  const [saldoRow] = await db
    .select()
    .from(saldosEndereco)
    .where(eq(saldosEndereco.id, input.saldoEnderecoId))
    .limit(1);

  if (!saldoRow) {
    throw new Error(
      `Saldo por endereço "${input.saldoEnderecoId}" não encontrado`,
    );
  }

  const quantidadeAtual = Number(saldoRow.quantidade);
  const delta = input.novaQuantidade - quantidadeAtual;

  if (delta === 0) {
    const mapped = await loadSaldoWithMotivo(db, saldoRow.id);
    if (!mapped) {
      throw new Error('Falha ao carregar saldo por endereço');
    }

    return mapped;
  }

  let resultId = saldoRow.id;

  await db.transaction(async (tx) => {
    if (input.novaQuantidade === 0) {
      await tx.delete(saldosEndereco).where(eq(saldosEndereco.id, saldoRow.id));
    } else {
      const [updated] = await tx
        .update(saldosEndereco)
        .set({
          quantidade: toQuantityString(input.novaQuantidade),
          updatedAt: sql`now()`,
        })
        .where(eq(saldosEndereco.id, saldoRow.id))
        .returning();

      if (!updated) {
        throw new Error('Falha ao ajustar saldo por endereço');
      }

      resultId = updated.id;
    }

    const documentoRef = `ajuste_saldo:${saldoRow.id}:${Date.now()}`;
    const motivoDetalhado = [
      input.motivo.trim(),
      `Quantidade: ${quantidadeAtual} → ${input.novaQuantidade} ${saldoRow.unidadeMedida}`,
    ].join(' · ');

    if (delta > 0) {
      await registrarMovimentacaoEstoqueDb(tx, {
        unidadeId: saldoRow.unidadeId,
        produtoId: saldoRow.produtoId,
        depositoDestinoId: saldoRow.depositoId,
        enderecoDestinoId: saldoRow.enderecoId,
        tipoMovimento: 'AJUSTE',
        quantidade: delta,
        unidadeMedida: saldoRow.unidadeMedida,
        lote: saldoRow.lote,
        validade: saldoRow.validade,
        numeroSerie: saldoRow.numeroSerie,
        natureza: saldoRow.natureza,
        documentoRef,
        motivo: motivoDetalhado,
        operatorId: input.operatorId ?? null,
      });
    } else {
      await registrarMovimentacaoEstoqueDb(tx, {
        unidadeId: saldoRow.unidadeId,
        produtoId: saldoRow.produtoId,
        depositoOrigemId: saldoRow.depositoId,
        enderecoOrigemId: saldoRow.enderecoId,
        tipoMovimento: 'AJUSTE',
        quantidade: Math.abs(delta),
        unidadeMedida: saldoRow.unidadeMedida,
        lote: saldoRow.lote,
        validade: saldoRow.validade,
        numeroSerie: saldoRow.numeroSerie,
        natureza: saldoRow.natureza,
        documentoRef,
        motivo: motivoDetalhado,
        operatorId: input.operatorId ?? null,
      });
    }
  });

  if (input.novaQuantidade === 0) {
    return mapSaldoEnderecoRow({
      ...saldoRow,
      quantidade: toQuantityString(0),
      updatedAt: new Date(),
    });
  }

  const mapped = await loadSaldoWithMotivo(db, resultId);
  if (!mapped) {
    throw new Error('Falha ao carregar saldo ajustado');
  }

  return mapped;
}
