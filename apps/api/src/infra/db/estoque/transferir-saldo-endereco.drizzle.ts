import { and, eq } from 'drizzle-orm';

import type { SaldoEndereco } from '../../../domain/model/estoque/saldo-endereco.model.js';
import type { TransferirSaldoEnderecoInput } from '../../../domain/repositories/estoque/estoque.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  enderecos,
  motivosBloqueioSaldo,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapSaldoEnderecoRow } from './map-estoque.drizzle.js';
import { registrarMovimentacaoEstoqueDb } from './registrar-movimentacao-estoque.drizzle.js';
import { upsertSaldoEnderecoDb } from './upsert-saldo-endereco.drizzle.js';

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

export async function transferirSaldoEnderecoDb(
  db: DrizzleClient,
  input: TransferirSaldoEnderecoInput,
): Promise<SaldoEndereco> {
  const saldoOrigem = await loadSaldoWithMotivo(db, input.saldoEnderecoId);

  if (!saldoOrigem) {
    throw new Error(
      `Saldo por endereço "${input.saldoEnderecoId}" não encontrado`,
    );
  }

  if (saldoOrigem.enderecoId === input.enderecoDestinoId) {
    throw new Error('Endereço de destino deve ser diferente do endereço de origem');
  }

  if (input.quantidade > saldoOrigem.quantidade) {
    throw new Error('Quantidade informada excede o saldo disponível na posição');
  }

  const [enderecoDestino] = await db
    .select()
    .from(enderecos)
    .where(
      and(
        eq(enderecos.id, input.enderecoDestinoId),
        eq(enderecos.unidadeId, saldoOrigem.unidadeId),
      ),
    )
    .limit(1);

  if (!enderecoDestino) {
    throw new Error(
      `Endereço de destino "${input.enderecoDestinoId}" não encontrado`,
    );
  }

  if (enderecoDestino.status !== 'disponivel' && enderecoDestino.status !== 'ocupado') {
    throw new Error('Endereço de destino não está disponível para receber saldo');
  }

  const documentoRef = `transferencia_saldo:${saldoOrigem.id}:${input.enderecoDestinoId}:${Date.now()}`;

  await db.transaction(async (tx) => {
    await upsertSaldoEnderecoDb(tx, {
      unidadeId: saldoOrigem.unidadeId,
      produtoId: saldoOrigem.produtoId,
      depositoId: saldoOrigem.depositoId,
      enderecoId: saldoOrigem.enderecoId,
      lote: saldoOrigem.lote,
      validade: saldoOrigem.validade,
      numeroSerie: saldoOrigem.numeroSerie,
      natureza: saldoOrigem.natureza,
      status: saldoOrigem.status,
      motivoBloqueioId: saldoOrigem.motivoBloqueio?.id ?? null,
      observacaoBloqueio: saldoOrigem.observacaoBloqueio,
      bloqueadoPor: saldoOrigem.bloqueadoPor,
      quantidadeDelta: -input.quantidade,
      unidadeMedida: saldoOrigem.unidadeMedida,
    });

    await upsertSaldoEnderecoDb(tx, {
      unidadeId: saldoOrigem.unidadeId,
      produtoId: saldoOrigem.produtoId,
      depositoId: saldoOrigem.depositoId,
      enderecoId: input.enderecoDestinoId,
      lote: saldoOrigem.lote,
      validade: saldoOrigem.validade,
      numeroSerie: saldoOrigem.numeroSerie,
      natureza: saldoOrigem.natureza,
      status: saldoOrigem.status,
      motivoBloqueioId: saldoOrigem.motivoBloqueio?.id ?? null,
      observacaoBloqueio: saldoOrigem.observacaoBloqueio,
      bloqueadoPor: saldoOrigem.bloqueadoPor,
      quantidadeDelta: input.quantidade,
      unidadeMedida: saldoOrigem.unidadeMedida,
    });

    await registrarMovimentacaoEstoqueDb(tx, {
      unidadeId: saldoOrigem.unidadeId,
      produtoId: saldoOrigem.produtoId,
      depositoOrigemId: saldoOrigem.depositoId,
      depositoDestinoId: saldoOrigem.depositoId,
      enderecoOrigemId: saldoOrigem.enderecoId,
      enderecoDestinoId: input.enderecoDestinoId,
      tipoMovimento: 'TRANSFERENCIA_DEPOSITO',
      quantidade: input.quantidade,
      unidadeMedida: saldoOrigem.unidadeMedida,
      lote: saldoOrigem.lote,
      validade: saldoOrigem.validade,
      numeroSerie: saldoOrigem.numeroSerie,
      natureza: saldoOrigem.natureza,
      documentoRef,
      motivo: input.observacao?.trim() || 'transferencia_posicao',
      operatorId: input.operatorId ?? null,
    });
  });

  const mapped = await loadSaldoWithMotivo(db, saldoOrigem.id);
  if (!mapped) {
    throw new Error('Falha ao carregar saldo após transferência');
  }

  return mapped;
}
