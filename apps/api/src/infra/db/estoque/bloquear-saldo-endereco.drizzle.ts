import { and, eq, sql } from 'drizzle-orm';

import type { SaldoEndereco } from '../../../domain/model/estoque/saldo-endereco.model.js';
import type {
  BloquearSaldoEnderecoInput,
  DesbloquearSaldoEnderecoInput,
} from '../../../domain/repositories/estoque/estoque.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  motivosBloqueioSaldo,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapSaldoEnderecoRow, toQuantityString } from './map-estoque.drizzle.js';
import { registrarMovimentacaoEstoqueDb } from './registrar-movimentacao-estoque.drizzle.js';
import { upsertSaldoEnderecoDb } from './upsert-saldo-endereco.drizzle.js';

async function loadSaldoById(db: DrizzleClient, id: string) {
  const [row] = await db
    .select()
    .from(saldosEndereco)
    .where(eq(saldosEndereco.id, id))
    .limit(1);

  return row ?? null;
}

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

export async function bloquearSaldoEnderecoDb(
  db: DrizzleClient,
  input: BloquearSaldoEnderecoInput,
): Promise<SaldoEndereco> {
  const saldo = await loadSaldoById(db, input.saldoEnderecoId);

  if (!saldo) {
    throw new Error(`Saldo por endereço "${input.saldoEnderecoId}" não encontrado`);
  }

  if (saldo.status !== 'liberado') {
    throw new Error('Somente saldos liberados podem ser bloqueados');
  }

  const [motivo] = await db
    .select()
    .from(motivosBloqueioSaldo)
    .where(eq(motivosBloqueioSaldo.id, input.motivoBloqueioId))
    .limit(1);

  if (!motivo) {
    throw new Error(`Motivo de bloqueio "${input.motivoBloqueioId}" não encontrado`);
  }

  const quantidadeTotal = Number(saldo.quantidade);
  const quantidadeBloquear = input.quantidade ?? quantidadeTotal;

  if (quantidadeBloquear <= 0) {
    throw new Error('Quantidade a bloquear deve ser maior que zero');
  }

  if (quantidadeBloquear > quantidadeTotal) {
    throw new Error('Quantidade informada excede o saldo liberado');
  }

  let resultId = saldo.id;

  await db.transaction(async (tx) => {
    await upsertSaldoEnderecoDb(tx, {
      unidadeId: saldo.unidadeId,
      produtoId: saldo.produtoId,
      depositoId: saldo.depositoId,
      enderecoId: saldo.enderecoId,
      lote: saldo.lote,
      validade: saldo.validade,
      numeroSerie: saldo.numeroSerie,
      natureza: saldo.natureza,
      status: 'liberado',
      quantidadeDelta: -quantidadeBloquear,
      unidadeMedida: saldo.unidadeMedida,
    });

    const bloqueado = await upsertSaldoEnderecoDb(tx, {
      unidadeId: saldo.unidadeId,
      produtoId: saldo.produtoId,
      depositoId: saldo.depositoId,
      enderecoId: saldo.enderecoId,
      lote: saldo.lote,
      validade: saldo.validade,
      numeroSerie: saldo.numeroSerie,
      natureza: saldo.natureza,
      status: 'bloqueado',
      motivoBloqueioId: input.motivoBloqueioId,
      observacaoBloqueio: input.observacao?.trim() ?? null,
      bloqueadoPor: input.operatorId ?? null,
      quantidadeDelta: quantidadeBloquear,
      unidadeMedida: saldo.unidadeMedida,
    });

    resultId =
      quantidadeBloquear < quantidadeTotal ? saldo.id : bloqueado.id;

    await registrarMovimentacaoEstoqueDb(tx, {
      unidadeId: saldo.unidadeId,
      produtoId: saldo.produtoId,
      depositoOrigemId: saldo.depositoId,
      enderecoOrigemId: saldo.enderecoId,
      tipoMovimento: 'AJUSTE',
      quantidade: quantidadeBloquear,
      unidadeMedida: saldo.unidadeMedida,
      lote: saldo.lote,
      validade: saldo.validade,
      numeroSerie: saldo.numeroSerie,
      natureza: saldo.natureza,
      documentoRef: `bloqueio_saldo:${saldo.id}:${Date.now()}`,
      motivo: motivo.codigo,
      operatorId: input.operatorId ?? null,
    });
  });

  const mapped = await loadSaldoWithMotivo(db, resultId);
  if (!mapped) {
    throw new Error('Falha ao carregar saldo após bloqueio');
  }

  return mapped;
}

export async function desbloquearSaldoEnderecoDb(
  db: DrizzleClient,
  input: DesbloquearSaldoEnderecoInput,
): Promise<SaldoEndereco> {
  const saldo = await loadSaldoById(db, input.saldoEnderecoId);

  if (!saldo) {
    throw new Error(`Saldo por endereço "${input.saldoEnderecoId}" não encontrado`);
  }

  if (saldo.status !== 'bloqueado') {
    throw new Error('Somente saldos bloqueados podem ser desbloqueados');
  }

  const quantidade = Number(saldo.quantidade);
  let resultId = saldo.id;

  await db.transaction(async (tx) => {
    const [liberadoExistente] = await tx
      .select()
      .from(saldosEndereco)
      .where(
        and(
          eq(saldosEndereco.produtoId, saldo.produtoId),
          eq(saldosEndereco.depositoId, saldo.depositoId),
          eq(saldosEndereco.enderecoId, saldo.enderecoId),
          eq(saldosEndereco.lote, saldo.lote),
          eq(saldosEndereco.numeroSerie, saldo.numeroSerie),
          eq(saldosEndereco.natureza, saldo.natureza),
          eq(saldosEndereco.status, 'liberado'),
        ),
      )
      .limit(1);

    if (liberadoExistente) {
      const novaQuantidade = Number(liberadoExistente.quantidade) + quantidade;

      await tx
        .update(saldosEndereco)
        .set({
          quantidade: toQuantityString(novaQuantidade),
          updatedAt: sql`now()`,
        })
        .where(eq(saldosEndereco.id, liberadoExistente.id));

      await tx.delete(saldosEndereco).where(eq(saldosEndereco.id, saldo.id));
      resultId = liberadoExistente.id;
    } else {
      const [updated] = await tx
        .update(saldosEndereco)
        .set({
          status: 'liberado',
          motivoBloqueioId: null,
          observacaoBloqueio: input.observacao?.trim() ?? null,
          bloqueadoEm: null,
          bloqueadoPor: null,
          updatedAt: sql`now()`,
        })
        .where(eq(saldosEndereco.id, saldo.id))
        .returning();

      if (!updated) {
        throw new Error('Falha ao desbloquear saldo por endereço');
      }

      resultId = updated.id;
    }

    await registrarMovimentacaoEstoqueDb(tx, {
      unidadeId: saldo.unidadeId,
      produtoId: saldo.produtoId,
      depositoDestinoId: saldo.depositoId,
      enderecoDestinoId: saldo.enderecoId,
      tipoMovimento: 'AJUSTE',
      quantidade,
      unidadeMedida: saldo.unidadeMedida,
      lote: saldo.lote,
      validade: saldo.validade,
      numeroSerie: saldo.numeroSerie,
      natureza: saldo.natureza,
      documentoRef: `desbloqueio_saldo:${saldo.id}:${Date.now()}`,
      motivo: 'desbloqueio_manual',
      operatorId: input.operatorId ?? null,
    });
  });

  const mapped = await loadSaldoWithMotivo(db, resultId);
  if (!mapped) {
    throw new Error('Falha ao carregar saldo desbloqueado');
  }

  return mapped;
}
