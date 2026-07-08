import { and, eq, sql } from 'drizzle-orm';

import { calcularValorDebitoPorKg } from '../../../application/services/cobranca-transportadora/calcular-item-debito-peso.js';
import {
  montarEventosAlteracaoItem,
  type CobrancaEventoItemAcao,
} from '../../../application/services/cobranca-transportadora/registrar-evento-item-processo-debito.js';
import type {
  AtualizarItemProcessoInput,
  AtualizarItemProcessoResult,
  DebitoItemStatus,
  DebitoItemTipo,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient, DrizzleExecutor } from '../providers/drizzle/drizzle.provider.js';
import {
  cobrancaEventos,
  devolucaoItens,
  processoDebitoItens,
  processosDebito,
} from '../providers/drizzle/config/migrations/schema.js';
import { findProdutosByCodigosRemessaDb } from '../produto/find-produtos-by-codigos-remessa.drizzle.js';

function recalcularValorTotalProcesso(processoId: string) {
  return sql<string>`coalesce(sum(case when ${processoDebitoItens.status} = 'cobrar' then ${processoDebitoItens.valorDebito} else 0 end), 0)`;
}

type ItemExistenteRecalculo = {
  tipo: DebitoItemTipo;
  sku: string | null;
  itemId: string | null;
  quantidade: string | null;
  valorUnitario: string | null;
};

type AtualizarItemProcessoDebitoInTxOptions = {
  registrarEvento?: boolean;
  atualizarValorTotalProcesso?: boolean;
};

export type ItemProcessoDebitoAlteracaoResumo = {
  statusNovo: CobrancaEventoItemAcao;
  statusAnterior?: string | null;
  statusDestino?: string | null;
};

async function resolverValorDebitoRecalculado(
  tx: DrizzleExecutor,
  existingItem: ItemExistenteRecalculo,
  input: AtualizarItemProcessoInput,
): Promise<number | null> {
  const valorUnitarioPorKg =
    input.valorUnitario ??
    (existingItem.valorUnitario != null
      ? Number(existingItem.valorUnitario)
      : null);

  if (valorUnitarioPorKg == null) {
    return null;
  }

  const quantidade =
    input.quantidade ??
    (existingItem.quantidade != null ? Number(existingItem.quantidade) : null);

  let qtdConferida: number | null = null;

  if (existingItem.itemId) {
    const [devolucaoItem] = await tx
      .select({ qtdConferida: devolucaoItens.qtdConferida })
      .from(devolucaoItens)
      .where(eq(devolucaoItens.id, existingItem.itemId))
      .limit(1);

    qtdConferida =
      devolucaoItem?.qtdConferida != null
        ? Number(devolucaoItem.qtdConferida)
        : null;
  }

  const sku = existingItem.sku?.trim() ?? '';
  const produtosPorSku = sku
    ? await findProdutosByCodigosRemessaDb(tx, [sku])
    : new Map<string, null>();
  const produto = sku ? (produtosPorSku.get(sku) ?? null) : null;

  return calcularValorDebitoPorKg(
    valorUnitarioPorKg,
    {
      tipo: existingItem.tipo,
      quantidade,
      qtdConferida,
    },
    produto,
  );
}

export async function atualizarItemProcessoDebitoInTx(
  tx: DrizzleExecutor,
  input: AtualizarItemProcessoInput,
  options: AtualizarItemProcessoDebitoInTxOptions = {},
): Promise<{
  result: AtualizarItemProcessoResult;
  alteracoes: ItemProcessoDebitoAlteracaoResumo[];
} | null> {
  const registrarEvento = options.registrarEvento ?? true;
  const atualizarValorTotalProcesso = options.atualizarValorTotalProcesso ?? true;

  const [existingItem] = await tx
    .select({
      id: processoDebitoItens.id,
      processoDebitoId: processoDebitoItens.processoDebitoId,
      tipo: processoDebitoItens.tipo,
      sku: processoDebitoItens.sku,
      descricaoProduto: processoDebitoItens.descricaoProduto,
      itemId: processoDebitoItens.itemId,
      quantidade: processoDebitoItens.quantidade,
      valorUnitario: processoDebitoItens.valorUnitario,
      valorDebito: processoDebitoItens.valorDebito,
      status: processoDebitoItens.status,
      observacao: processoDebitoItens.observacao,
    })
    .from(processoDebitoItens)
    .where(
      and(
        eq(processoDebitoItens.id, input.itemId),
        eq(processoDebitoItens.processoDebitoId, input.processoId),
      ),
    )
    .limit(1);

  if (!existingItem) return null;

  const now = new Date();
  const updateSet: Record<string, unknown> = { updatedAt: now };

  if (input.valorUnitario !== undefined) {
    updateSet.valorUnitario =
      input.valorUnitario != null ? String(input.valorUnitario) : null;
  }

  if (input.quantidade !== undefined) {
    updateSet.quantidade = String(input.quantidade);
  }

  const deveRecalcularValor =
    input.valorDebito === undefined &&
    (input.quantidade !== undefined || input.valorUnitario !== undefined);

  if (input.valorDebito !== undefined) {
    updateSet.valorDebito = String(input.valorDebito);
  } else if (deveRecalcularValor) {
    const valorRecalculado = await resolverValorDebitoRecalculado(
      tx,
      existingItem,
      input,
    );

    if (valorRecalculado != null) {
      updateSet.valorDebito = String(valorRecalculado);
    }
  }

  if (input.status !== undefined) {
    updateSet.status =
      existingItem.tipo === 'sobra' ? 'sobra' : input.status;
  }

  if (input.observacao !== undefined) {
    updateSet.observacao = input.observacao;
  }

  if (existingItem.tipo === 'sobra' && input.status === undefined) {
    updateSet.status = 'sobra';
  }

  const [updatedItem] = await tx
    .update(processoDebitoItens)
    .set(updateSet)
    .where(eq(processoDebitoItens.id, input.itemId))
    .returning({
      id: processoDebitoItens.id,
      processoDebitoId: processoDebitoItens.processoDebitoId,
      valorDebito: processoDebitoItens.valorDebito,
      status: processoDebitoItens.status,
    });

  if (!updatedItem) return null;

  let valorTotalProcesso = 0;

  if (atualizarValorTotalProcesso) {
    const [totals] = await tx
      .select({
        valorTotal: recalcularValorTotalProcesso(input.processoId),
      })
      .from(processoDebitoItens)
      .where(eq(processoDebitoItens.processoDebitoId, input.processoId));

    valorTotalProcesso = Number(totals?.valorTotal ?? 0);

    await tx
      .update(processosDebito)
      .set({
        valorTotal: totals?.valorTotal ?? '0',
        updatedAt: now,
      })
      .where(eq(processosDebito.id, input.processoId));
  }

  const valorUnitarioNovo =
    input.valorUnitario !== undefined
      ? input.valorUnitario
      : existingItem.valorUnitario != null
        ? Number(existingItem.valorUnitario)
        : null;
  const valorDebitoNovo = Number(updatedItem.valorDebito);
  const statusNovo = String(updatedItem.status);
  const observacaoNova =
    input.observacao !== undefined
      ? input.observacao
      : existingItem.observacao;

  const eventos = montarEventosAlteracaoItem({
    sku: existingItem.sku,
    descricaoProduto: existingItem.descricaoProduto,
    quantidadeAnterior:
      existingItem.quantidade != null ? Number(existingItem.quantidade) : null,
    quantidadeNova: input.quantidade !== undefined ? input.quantidade : null,
    statusAnterior: existingItem.status,
    statusNovo: input.status !== undefined ? statusNovo : null,
    observacaoAnterior: existingItem.observacao,
    observacaoNova:
      input.observacao !== undefined ? observacaoNova : undefined,
    valorUnitarioAnterior:
      existingItem.valorUnitario != null
        ? Number(existingItem.valorUnitario)
        : null,
    valorUnitarioNovo:
      input.valorUnitario !== undefined ? valorUnitarioNovo : null,
    valorDebitoAnterior: Number(existingItem.valorDebito),
    valorDebitoNovo:
      input.valorDebito !== undefined || updateSet.valorDebito !== undefined
        ? valorDebitoNovo
        : null,
  });

  const alteracoes: ItemProcessoDebitoAlteracaoResumo[] = eventos.map(
    (evento) => ({
      statusNovo: evento.statusNovo,
      statusAnterior:
        input.status !== undefined ? existingItem.status : undefined,
      statusDestino:
        input.status !== undefined ? statusNovo : undefined,
    }),
  );

  if (registrarEvento && eventos.length > 0) {
    await tx.insert(cobrancaEventos).values(
      eventos.map((evento) => ({
        entidadeTipo: 'processo' as const,
        entidadeId: input.processoId,
        statusAnterior: null,
        statusNovo: evento.statusNovo,
        descricao: evento.descricao,
        criadoPorUserId: input.criadoPorUserId ?? null,
      })),
    );
  }

  return {
    result: {
      id: updatedItem.id,
      processoDebitoId: updatedItem.processoDebitoId,
      valorDebito: Number(updatedItem.valorDebito),
      status: updatedItem.status as DebitoItemStatus,
      valorTotalProcesso,
    },
    alteracoes,
  };
}

export async function atualizarItemProcessoDebitoDb(
  db: DrizzleClient,
  input: AtualizarItemProcessoInput,
): Promise<AtualizarItemProcessoResult | null> {
  return db.transaction(async (tx) => {
    const [processo] = await tx
      .select({ id: processosDebito.id })
      .from(processosDebito)
      .where(
        and(
          eq(processosDebito.id, input.processoId),
          eq(processosDebito.unidadeId, input.unidadeId),
        ),
      )
      .limit(1);

    if (!processo) return null;

    const atualizado = await atualizarItemProcessoDebitoInTx(tx, input);

    return atualizado?.result ?? null;
  });
}
