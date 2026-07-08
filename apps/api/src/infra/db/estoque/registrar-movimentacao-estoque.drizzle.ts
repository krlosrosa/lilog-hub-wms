import { eq } from 'drizzle-orm';

import type { NaturezaSaldo } from '../../../domain/model/estoque/saldo.model.js';
import type {
  DrizzleClient,
  DrizzleExecutor,
} from '../providers/drizzle/drizzle.provider.js';
import { movimentacoesEstoque } from '../providers/drizzle/config/migrations/schema.js';
import {
  normalizeLote,
  normalizeNumeroSerie,
  toQuantityString,
} from './map-estoque.drizzle.js';

export type TipoMovimentoEstoque =
  | 'ENTRADA'
  | 'SAIDA'
  | 'TRANSFERENCIA_DEPOSITO'
  | 'AJUSTE'
  | 'ESTORNO';

export type RegistrarMovimentacaoEstoqueInput = {
  unidadeId: string;
  produtoId: string;
  depositoOrigemId?: string | null;
  depositoDestinoId?: string | null;
  enderecoOrigemId?: string | null;
  enderecoDestinoId?: string | null;
  tipoMovimento: TipoMovimentoEstoque;
  quantidade: number;
  unidadeMedida: string;
  lote?: string | null;
  validade?: Date | null;
  numeroSerie?: string | null;
  natureza?: NaturezaSaldo;
  documentoRef?: string | null;
  motivo: string;
  operatorId?: number | null;
  occurredAt?: Date;
};

export type MovimentacaoEstoqueRecord = {
  id: string;
};

export async function existsMovimentacaoByDocumentoRefDb(
  db: DrizzleClient,
  documentoRef: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: movimentacoesEstoque.id })
    .from(movimentacoesEstoque)
    .where(eq(movimentacoesEstoque.documentoRef, documentoRef))
    .limit(1);

  return Boolean(row);
}

export async function registrarMovimentacaoEstoqueDb(
  db: DrizzleExecutor,
  input: RegistrarMovimentacaoEstoqueInput,
): Promise<MovimentacaoEstoqueRecord> {
  const [created] = await db
    .insert(movimentacoesEstoque)
    .values({
      unidadeId: input.unidadeId,
      produtoId: input.produtoId,
      depositoOrigemId: input.depositoOrigemId ?? null,
      depositoDestinoId: input.depositoDestinoId ?? null,
      enderecoOrigemId: input.enderecoOrigemId ?? null,
      enderecoDestinoId: input.enderecoDestinoId ?? null,
      tipoMovimento: input.tipoMovimento,
      quantidade: toQuantityString(input.quantidade),
      unidadeMedida: input.unidadeMedida,
      lote: normalizeLote(input.lote) || null,
      validade: input.validade ?? null,
      numeroSerie: normalizeNumeroSerie(input.numeroSerie) || null,
      natureza: input.natureza ?? 'fisico',
      documentoRef: input.documentoRef ?? null,
      motivo: input.motivo,
      operatorId: input.operatorId ?? null,
      occurredAt: input.occurredAt ?? new Date(),
    })
    .returning({ id: movimentacoesEstoque.id });

  if (!created) {
    throw new Error('Falha ao registrar movimentação de estoque');
  }

  return created;
}
