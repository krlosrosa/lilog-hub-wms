import { and, eq, sql } from 'drizzle-orm';

import type { NaturezaSaldo } from '../../../domain/model/estoque/saldo.model.js';
import type { StatusSaldoEndereco } from '../../../domain/model/estoque/saldo-endereco.model.js';
import type { SaldoEndereco } from '../../../domain/model/estoque/saldo-endereco.model.js';
import type { DrizzleExecutor } from '../providers/drizzle/drizzle.provider.js';
import {
  motivosBloqueioSaldo,
  saldosEndereco,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapSaldoEnderecoRow,
  normalizeLote,
  normalizeNumeroSerie,
  toQuantityString,
} from './map-estoque.drizzle.js';

export type UpsertSaldoEnderecoInput = {
  unidadeId: string;
  produtoId: string;
  depositoId: string;
  enderecoId: string;
  lote?: string | null;
  validade?: Date | null;
  numeroSerie?: string | null;
  natureza?: NaturezaSaldo;
  status?: StatusSaldoEndereco;
  motivoBloqueioId?: string | null;
  observacaoBloqueio?: string | null;
  bloqueadoPor?: number | null;
  quantidadeDelta: number;
  unidadeMedida: string;
};

async function findSaldoWithMotivo(
  db: DrizzleExecutor,
  saldoId: string,
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
    .where(eq(saldosEndereco.id, saldoId))
    .limit(1);

  if (!row) {
    return null;
  }

  return mapSaldoEnderecoRow(row.saldo, { motivo: row.motivo });
}

export async function upsertSaldoEnderecoDb(
  db: DrizzleExecutor,
  input: UpsertSaldoEnderecoInput,
): Promise<SaldoEndereco> {
  const lote = normalizeLote(input.lote);
  const numeroSerie = normalizeNumeroSerie(input.numeroSerie);
  const natureza = input.natureza ?? 'fisico';
  const status = input.status ?? 'liberado';

  const [existing] = await db
    .select()
    .from(saldosEndereco)
    .where(
      and(
        eq(saldosEndereco.produtoId, input.produtoId),
        eq(saldosEndereco.depositoId, input.depositoId),
        eq(saldosEndereco.enderecoId, input.enderecoId),
        eq(saldosEndereco.lote, lote),
        eq(saldosEndereco.numeroSerie, numeroSerie),
        eq(saldosEndereco.natureza, natureza),
        eq(saldosEndereco.status, status),
      ),
    )
    .limit(1);

  if (existing) {
    const novaQuantidade = Number(existing.quantidade) + input.quantidadeDelta;

    if (novaQuantidade < 0) {
      throw new Error(
        `Saldo insuficiente para produto "${input.produtoId}" no endereço "${input.enderecoId}"`,
      );
    }

    const [updated] = await db
      .update(saldosEndereco)
      .set({
        quantidade: toQuantityString(novaQuantidade),
        unidadeMedida: input.unidadeMedida,
        validade: input.validade ?? existing.validade,
        updatedAt: sql`now()`,
      })
      .where(eq(saldosEndereco.id, existing.id))
      .returning();

    if (!updated) {
      throw new Error('Falha ao atualizar saldo por endereço');
    }

    const mapped = await findSaldoWithMotivo(db, updated.id);
    if (!mapped) {
      throw new Error('Falha ao carregar saldo por endereço atualizado');
    }

    return mapped;
  }

  if (input.quantidadeDelta < 0) {
    throw new Error(
      `Não é possível decrementar saldo inexistente para produto "${input.produtoId}"`,
    );
  }

  if (status === 'bloqueado' && !input.motivoBloqueioId) {
    throw new Error(
      'motivoBloqueioId é obrigatório ao criar saldo bloqueado',
    );
  }

  const [created] = await db
    .insert(saldosEndereco)
    .values({
      unidadeId: input.unidadeId,
      produtoId: input.produtoId,
      depositoId: input.depositoId,
      enderecoId: input.enderecoId,
      lote,
      validade: input.validade ?? null,
      numeroSerie,
      natureza,
      status,
      motivoBloqueioId:
        status === 'bloqueado' ? (input.motivoBloqueioId ?? null) : null,
      observacaoBloqueio:
        status === 'bloqueado' ? (input.observacaoBloqueio ?? null) : null,
      bloqueadoEm: status === 'bloqueado' ? sql`now()` : null,
      bloqueadoPor:
        status === 'bloqueado' ? (input.bloqueadoPor ?? null) : null,
      quantidade: toQuantityString(input.quantidadeDelta),
      unidadeMedida: input.unidadeMedida,
    })
    .returning();

  if (!created) {
    throw new Error('Falha ao criar saldo por endereço');
  }

  const mapped = await findSaldoWithMotivo(db, created.id);
  if (!mapped) {
    throw new Error('Falha ao carregar saldo por endereço criado');
  }

  return mapped;
}
