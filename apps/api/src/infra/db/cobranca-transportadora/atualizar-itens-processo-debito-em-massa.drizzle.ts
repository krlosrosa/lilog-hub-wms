import { and, eq, sql } from 'drizzle-orm';

import { montarEventoAlteracaoItensEmMassa } from '../../../application/services/cobranca-transportadora/registrar-evento-item-processo-debito.js';
import type {
  AtualizarItensProcessoEmMassaInput,
  AtualizarItensProcessoEmMassaResult,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cobrancaEventos,
  processoDebitoItens,
  processosDebito,
} from '../providers/drizzle/config/migrations/schema.js';
import { atualizarItemProcessoDebitoInTx } from './atualizar-item-processo-debito.drizzle.js';

function recalcularValorTotalProcesso(processoId: string) {
  return sql<string>`coalesce(sum(case when ${processoDebitoItens.status} = 'cobrar' then ${processoDebitoItens.valorDebito} else 0 end), 0)`;
}

export async function atualizarItensProcessoDebitoEmMassaDb(
  db: DrizzleClient,
  input: AtualizarItensProcessoEmMassaInput,
): Promise<AtualizarItensProcessoEmMassaResult | null> {
  if (input.itens.length === 0) {
    return null;
  }

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

    const alteracoesAcumuladas: Parameters<
      typeof montarEventoAlteracaoItensEmMassa
    >[0]['alteracoes'] = [];

    let quantidadeItensAtualizados = 0;

    for (const item of input.itens) {
      const atualizado = await atualizarItemProcessoDebitoInTx(
        tx,
        {
          processoId: input.processoId,
          itemId: item.itemId,
          unidadeId: input.unidadeId,
          valorUnitario: item.valorUnitario,
          valorDebito: item.valorDebito,
          quantidade: item.quantidade,
          status: item.status,
          observacao: item.observacao,
          criadoPorUserId: input.criadoPorUserId,
        },
        {
          registrarEvento: false,
          atualizarValorTotalProcesso: false,
        },
      );

      if (!atualizado) {
        continue;
      }

      if (atualizado.alteracoes.length > 0) {
        quantidadeItensAtualizados += 1;
        alteracoesAcumuladas.push(...atualizado.alteracoes);
      }
    }

    if (quantidadeItensAtualizados === 0) {
      return null;
    }

    const now = new Date();

    const [totals] = await tx
      .select({
        valorTotal: recalcularValorTotalProcesso(input.processoId),
      })
      .from(processoDebitoItens)
      .where(eq(processoDebitoItens.processoDebitoId, input.processoId));

    const valorTotal = totals?.valorTotal ?? '0';

    await tx
      .update(processosDebito)
      .set({
        valorTotal,
        updatedAt: now,
      })
      .where(eq(processosDebito.id, input.processoId));

    const eventoLote = montarEventoAlteracaoItensEmMassa({
      quantidadeItens: quantidadeItensAtualizados,
      alteracoes: alteracoesAcumuladas,
    });

    if (eventoLote) {
      await tx.insert(cobrancaEventos).values({
        entidadeTipo: 'processo',
        entidadeId: input.processoId,
        statusAnterior: null,
        statusNovo: eventoLote.statusNovo,
        descricao: eventoLote.descricao,
        criadoPorUserId: input.criadoPorUserId ?? null,
      });
    }

    return {
      quantidadeItensAtualizados,
      valorTotalProcesso: Number(valorTotal),
    };
  });
}
