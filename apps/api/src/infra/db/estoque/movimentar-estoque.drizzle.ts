import { and, eq, or } from 'drizzle-orm';

import type {
  AjustarSaldoInput,
  EstornarPorDocumentoInput,
  MovimentacaoEstoque,
  NaturezaSaldo,
  RegistrarEntradaInput,
  TransferirDepositoInput,
} from '../../../domain/model/estoque/movimentacao-estoque.model.js';
import type {
  DrizzleClient,
  DrizzleExecutor,
} from '../providers/drizzle/drizzle.provider.js';
import { users } from '../providers/drizzle/config/migrations/schema.js';
import {
  depositos,
  movimentacoesEstoque,
  saldos,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapMovimentacaoRow,
  normalizeLote,
  normalizeNumeroSerie,
  toQuantityNumber,
  toQuantityString,
} from './map-estoque.drizzle.js';

function normalizeDocumentoRef(documentoRef?: string | null): string {
  return documentoRef?.trim() ?? '';
}

type SaldoKey = {
  unidadeId: string;
  produtoId: string;
  depositoId: string;
  lote: string;
  numeroSerie: string;
  natureza: NaturezaSaldo;
  unidadeMedida: string;
  documentoRef: string;
  validade?: Date | null;
};

function saldoKeyConditions(key: SaldoKey) {
  return and(
    eq(saldos.unidadeId, key.unidadeId),
    eq(saldos.produtoId, key.produtoId),
    eq(saldos.depositoId, key.depositoId),
    eq(saldos.lote, key.lote),
    eq(saldos.numeroSerie, key.numeroSerie),
    eq(saldos.natureza, key.natureza),
    eq(saldos.documentoRef, key.documentoRef),
  );
}

async function findDepositoByIdDb(db: DrizzleExecutor, depositoId: string) {
  const [row] = await db
    .select()
    .from(depositos)
    .where(eq(depositos.id, depositoId))
    .limit(1);

  return row ?? null;
}

async function getSaldoAtualDb(db: DrizzleExecutor, key: SaldoKey): Promise<number> {
  const [row] = await db
    .select()
    .from(saldos)
    .where(saldoKeyConditions(key))
    .limit(1);

  return row ? toQuantityNumber(row.quantidade) : 0;
}

async function applySaldoDeltaDb(
  db: DrizzleExecutor,
  key: SaldoKey,
  delta: number,
): Promise<void> {
  if (delta === 0) {
    return;
  }

  const atual = await getSaldoAtualDb(db, key);
  const novo = atual + delta;

  if (key.natureza === 'fisico' && novo < 0) {
    throw new Error('Saldo físico não pode ficar negativo');
  }

  if (novo === 0) {
    await db.delete(saldos).where(saldoKeyConditions(key));
    return;
  }

  const [existing] = await db
    .select()
    .from(saldos)
    .where(saldoKeyConditions(key))
    .limit(1);

  if (existing) {
    await db
      .update(saldos)
      .set({
        quantidade: toQuantityString(novo),
        unidadeMedida: key.unidadeMedida,
        validade: key.validade ?? existing.validade,
        updatedAt: new Date(),
      })
      .where(eq(saldos.id, existing.id));
    return;
  }

  await db.insert(saldos).values({
    unidadeId: key.unidadeId,
    produtoId: key.produtoId,
    depositoId: key.depositoId,
    lote: key.lote,
    numeroSerie: key.numeroSerie,
    natureza: key.natureza,
    documentoRef: key.documentoRef,
    quantidade: toQuantityString(novo),
    unidadeMedida: key.unidadeMedida,
    validade: key.validade ?? null,
  });
}

async function resolveOperatorIdDb(
  db: DrizzleExecutor,
  operatorId?: number | null,
): Promise<number | null> {
  if (!operatorId) {
    return null;
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, operatorId))
    .limit(1);

  return user ? operatorId : null;
}

async function insertMovimentacaoDb(
  db: DrizzleExecutor,
  data: {
    unidadeId: string;
    produtoId: string;
    depositoOrigemId: string | null;
    depositoDestinoId: string | null;
    tipoMovimento: MovimentacaoEstoque['tipoMovimento'];
    quantidade: number;
    unidadeMedida: string;
    lote?: string | null;
    validade?: Date | null;
    numeroSerie?: string | null;
    natureza: NaturezaSaldo;
    documentoRef?: string | null;
    motivo: string;
    operatorId?: number | null;
  },
): Promise<MovimentacaoEstoque> {
  const operatorId = await resolveOperatorIdDb(db, data.operatorId);

  const [row] = await db
    .insert(movimentacoesEstoque)
    .values({
      unidadeId: data.unidadeId,
      produtoId: data.produtoId,
      depositoOrigemId: data.depositoOrigemId,
      depositoDestinoId: data.depositoDestinoId,
      tipoMovimento: data.tipoMovimento,
      quantidade: toQuantityString(data.quantidade),
      unidadeMedida: data.unidadeMedida,
      lote: data.lote ?? null,
      validade: data.validade ?? null,
      numeroSerie: data.numeroSerie ?? null,
      natureza: data.natureza,
      documentoRef: data.documentoRef ?? null,
      motivo: data.motivo,
      operatorId,
      occurredAt: new Date(),
    })
    .returning();

  if (!row) {
    throw new Error('Falha ao registrar movimentação de estoque');
  }

  return mapMovimentacaoRow(row);
}

function buildSaldoKey(
  input: {
    unidadeId: string;
    produtoId: string;
    depositoId: string;
    unidadeMedida: string;
    lote?: string | null;
    validade?: Date | null;
    numeroSerie?: string | null;
    natureza?: NaturezaSaldo;
    documentoRef?: string | null;
  },
): SaldoKey {
  return {
    unidadeId: input.unidadeId,
    produtoId: input.produtoId,
    depositoId: input.depositoId,
    lote: normalizeLote(input.lote),
    numeroSerie: normalizeNumeroSerie(input.numeroSerie),
    natureza: input.natureza ?? 'fisico',
    unidadeMedida: input.unidadeMedida,
    documentoRef: normalizeDocumentoRef(input.documentoRef),
    validade: input.validade ?? null,
  };
}

export async function registrarEntradaDb(
  db: DrizzleClient,
  input: RegistrarEntradaInput,
): Promise<MovimentacaoEstoque> {
  const deposito = await findDepositoByIdDb(db, input.depositoId);

  if (!deposito || !deposito.ativo) {
    throw new Error('Depósito inválido ou inativo');
  }

  if (deposito.unidadeId !== input.unidadeId) {
    throw new Error('Depósito não pertence à unidade informada');
  }

  return db.transaction(async (tx) => {
    const key = buildSaldoKey({
      unidadeId: input.unidadeId,
      produtoId: input.produtoId,
      depositoId: input.depositoId,
      unidadeMedida: input.unidadeMedida,
      lote: input.lote,
      validade: input.validade,
      numeroSerie: input.numeroSerie,
      natureza: input.natureza,
      documentoRef: input.documentoRef,
    });

    await applySaldoDeltaDb(tx, key, input.quantidade);

    return insertMovimentacaoDb(tx, {
      unidadeId: input.unidadeId,
      produtoId: input.produtoId,
      depositoOrigemId: null,
      depositoDestinoId: input.depositoId,
      tipoMovimento: 'ENTRADA',
      quantidade: input.quantidade,
      unidadeMedida: input.unidadeMedida,
      lote: key.lote,
      validade: key.validade,
      numeroSerie: key.numeroSerie,
      natureza: key.natureza,
      documentoRef: input.documentoRef,
      motivo: input.motivo,
      operatorId: input.operatorId,
    });
  });
}

export async function transferirDepositoDb(
  db: DrizzleClient,
  input: TransferirDepositoInput,
): Promise<MovimentacaoEstoque> {
  const [origem, destino] = await Promise.all([
    findDepositoByIdDb(db, input.depositoOrigemId),
    findDepositoByIdDb(db, input.depositoDestinoId),
  ]);

  if (!origem?.ativo || !destino?.ativo) {
    throw new Error('Depósitos de origem/destino inválidos ou inativos');
  }

  if (
    origem.unidadeId !== input.unidadeId ||
    destino.unidadeId !== input.unidadeId
  ) {
    throw new Error('Depósitos devem pertencer à mesma unidade');
  }

  return db.transaction(async (tx) => {
    const origemKey = buildSaldoKey({
      unidadeId: input.unidadeId,
      produtoId: input.produtoId,
      depositoId: input.depositoOrigemId,
      unidadeMedida: input.unidadeMedida,
      lote: input.lote,
      validade: input.validade,
      numeroSerie: input.numeroSerie,
      natureza: input.natureza,
      documentoRef: input.documentoRef,
    });

    const destinoKey = buildSaldoKey({
      unidadeId: input.unidadeId,
      produtoId: input.produtoId,
      depositoId: input.depositoDestinoId,
      unidadeMedida: input.unidadeMedida,
      lote: input.lote,
      validade: input.validade,
      numeroSerie: input.numeroSerie,
      natureza: input.natureza,
      documentoRef: '',
    });

    await applySaldoDeltaDb(tx, origemKey, -input.quantidade);
    await applySaldoDeltaDb(tx, destinoKey, input.quantidade);

    return insertMovimentacaoDb(tx, {
      unidadeId: input.unidadeId,
      produtoId: input.produtoId,
      depositoOrigemId: input.depositoOrigemId,
      depositoDestinoId: input.depositoDestinoId,
      tipoMovimento: 'TRANSFERENCIA_DEPOSITO',
      quantidade: input.quantidade,
      unidadeMedida: input.unidadeMedida,
      lote: origemKey.lote,
      validade: origemKey.validade,
      numeroSerie: origemKey.numeroSerie,
      natureza: origemKey.natureza,
      documentoRef: input.documentoRef,
      motivo: input.motivo,
      operatorId: input.operatorId,
    });
  });
}

export async function ajustarSaldoDb(
  db: DrizzleClient,
  input: AjustarSaldoInput,
): Promise<MovimentacaoEstoque> {
  const deposito = await findDepositoByIdDb(db, input.depositoId);

  if (!deposito?.ativo) {
    throw new Error('Depósito inválido ou inativo');
  }

  if (deposito.unidadeId !== input.unidadeId) {
    throw new Error('Depósito não pertence à unidade informada');
  }

  return db.transaction(async (tx) => {
    const key = buildSaldoKey({
      unidadeId: input.unidadeId,
      produtoId: input.produtoId,
      depositoId: input.depositoId,
      unidadeMedida: input.unidadeMedida,
      lote: input.lote,
      validade: input.validade,
      numeroSerie: input.numeroSerie,
      natureza: input.natureza,
      documentoRef: input.documentoRef,
    });

    await applySaldoDeltaDb(tx, key, input.delta);

    return insertMovimentacaoDb(tx, {
      unidadeId: input.unidadeId,
      produtoId: input.produtoId,
      depositoOrigemId: input.delta < 0 ? input.depositoId : null,
      depositoDestinoId: input.delta > 0 ? input.depositoId : null,
      tipoMovimento: 'AJUSTE',
      quantidade: Math.abs(input.delta),
      unidadeMedida: input.unidadeMedida,
      lote: key.lote,
      validade: key.validade,
      numeroSerie: key.numeroSerie,
      natureza: key.natureza,
      documentoRef: input.documentoRef,
      motivo: input.motivo,
      operatorId: input.operatorId,
    });
  });
}

export async function estornarPorDocumentoDb(
  db: DrizzleClient,
  input: EstornarPorDocumentoInput,
): Promise<MovimentacaoEstoque[]> {
  const deposito = await findDepositoByIdDb(db, input.depositoId);

  if (!deposito?.ativo) {
    throw new Error('Depósito inválido ou inativo');
  }

  const movimentos = await db
    .select()
    .from(movimentacoesEstoque)
    .where(
      and(
        eq(movimentacoesEstoque.documentoRef, input.documentoRef),
        or(
          eq(movimentacoesEstoque.depositoDestinoId, input.depositoId),
          eq(movimentacoesEstoque.depositoOrigemId, input.depositoId),
        ),
      ),
    );

  const netByKey = new Map<
    string,
    {
      key: SaldoKey;
      net: number;
      unidadeMedida: string;
    }
  >();

  for (const movimento of movimentos) {
    if (movimento.depositoDestinoId === input.depositoId) {
      const key = buildSaldoKey({
        unidadeId: movimento.unidadeId,
        produtoId: movimento.produtoId,
        depositoId: input.depositoId,
        unidadeMedida: movimento.unidadeMedida,
        lote: movimento.lote,
        validade: movimento.validade,
        numeroSerie: movimento.numeroSerie,
        natureza: movimento.natureza,
        documentoRef: movimento.documentoRef,
      });
      const mapKey = JSON.stringify(key);
      const current = netByKey.get(mapKey) ?? {
        key,
        net: 0,
        unidadeMedida: movimento.unidadeMedida,
      };
      current.net += toQuantityNumber(movimento.quantidade);
      netByKey.set(mapKey, current);
    }

    if (movimento.depositoOrigemId === input.depositoId) {
      const key = buildSaldoKey({
        unidadeId: movimento.unidadeId,
        produtoId: movimento.produtoId,
        depositoId: input.depositoId,
        unidadeMedida: movimento.unidadeMedida,
        lote: movimento.lote,
        validade: movimento.validade,
        numeroSerie: movimento.numeroSerie,
        natureza: movimento.natureza,
        documentoRef: movimento.documentoRef,
      });
      const mapKey = JSON.stringify(key);
      const current = netByKey.get(mapKey) ?? {
        key,
        net: 0,
        unidadeMedida: movimento.unidadeMedida,
      };
      current.net -= toQuantityNumber(movimento.quantidade);
      netByKey.set(mapKey, current);
    }
  }

  const results: MovimentacaoEstoque[] = [];

  await db.transaction(async (tx) => {
    for (const entry of netByKey.values()) {
      if (entry.net <= 0) {
        continue;
      }

      await applySaldoDeltaDb(tx, entry.key, -entry.net);

      const movimentacao = await insertMovimentacaoDb(tx, {
        unidadeId: input.unidadeId,
        produtoId: entry.key.produtoId,
        depositoOrigemId: input.depositoId,
        depositoDestinoId: null,
        tipoMovimento: 'ESTORNO',
        quantidade: entry.net,
        unidadeMedida: entry.unidadeMedida,
        lote: entry.key.lote,
        validade: entry.key.validade,
        numeroSerie: entry.key.numeroSerie,
        natureza: entry.key.natureza,
        documentoRef: input.documentoRef,
        motivo: input.motivo,
        operatorId: input.operatorId,
      });

      results.push(movimentacao);
    }
  });

  return results;
}
