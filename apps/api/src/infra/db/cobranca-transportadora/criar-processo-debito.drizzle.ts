import { and, count, eq } from 'drizzle-orm';

import type {
  CriarProcessoDebitoInput,
  CriarProcessoDebitoResult,
  ProcessoDebitoListItem,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cobrancaEventos,
  demandasDevolucao,
  processoDebitoItens,
  processosDebito,
} from '../providers/drizzle/config/migrations/schema.js';

export async function buscarProcessoPorDemandaIdDb(
  db: DrizzleClient,
  demandaId: string,
  unidadeId: string,
): Promise<ProcessoDebitoListItem | null> {
  const [row] = await db
    .select({
      id: processosDebito.id,
      unidadeId: processosDebito.unidadeId,
      demandaId: processosDebito.demandaId,
      codigoDemanda: demandasDevolucao.codigoDemanda,
      transporteId: processosDebito.transporteId,
      transportadoraId: processosDebito.transportadoraId,
      transportadoraNome: processosDebito.transportadoraNome,
      status: processosDebito.status,
      valorTotal: processosDebito.valorTotal,
      quantidadeItens: processosDebito.quantidadeItens,
      createdAt: processosDebito.createdAt,
      updatedAt: processosDebito.updatedAt,
    })
    .from(processosDebito)
    .innerJoin(
      demandasDevolucao,
      eq(processosDebito.demandaId, demandasDevolucao.id),
    )
    .where(
      and(
        eq(processosDebito.demandaId, demandaId),
        eq(processosDebito.unidadeId, unidadeId),
      ),
    )
    .limit(1);

  if (!row) return null;

  const contagemRows = await db
    .select({
      tipo: processoDebitoItens.tipo,
      total: count(),
    })
    .from(processoDebitoItens)
    .where(eq(processoDebitoItens.processoDebitoId, row.id))
    .groupBy(processoDebitoItens.tipo);

  let quantidadeItensFalta = 0;
  let quantidadeItensAvaria = 0;

  for (const contagem of contagemRows) {
    if (contagem.tipo === 'falta') {
      quantidadeItensFalta = Number(contagem.total);
    } else {
      quantidadeItensAvaria = Number(contagem.total);
    }
  }

  return {
    id: row.id,
    unidadeId: row.unidadeId,
    demandaId: row.demandaId,
    codigoDemanda: row.codigoDemanda,
    transporteId: row.transporteId,
    transportadoraId: row.transportadoraId,
    transportadoraNome: row.transportadoraNome,
    status: row.status,
    valorTotal: Number(row.valorTotal),
    quantidadeItens: row.quantidadeItens,
    quantidadeItensFalta,
    quantidadeItensAvaria,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function criarProcessoDebitoDb(
  db: DrizzleClient,
  input: CriarProcessoDebitoInput,
): Promise<CriarProcessoDebitoResult> {
  return db.transaction(async (tx) => {
    const valorTotal = input.itens.reduce(
      (acc, item) => acc + (item.valorDebito ?? 0),
      0,
    );

    const [processo] = await tx
      .insert(processosDebito)
      .values({
        unidadeId: input.unidadeId,
        demandaId: input.demandaId,
        transporteId: input.transporteId ?? null,
        transportadoraId: input.transportadoraId ?? null,
        transportadoraNome: input.transportadoraNome ?? null,
        status: 'aberto',
        valorTotal: String(valorTotal),
        quantidadeItens: input.itens.length,
        observacao: input.observacao ?? null,
        criadoPorUserId: input.criadoPorUserId ?? null,
      })
      .returning({
        id: processosDebito.id,
        demandaId: processosDebito.demandaId,
        status: processosDebito.status,
        quantidadeItens: processosDebito.quantidadeItens,
        valorTotal: processosDebito.valorTotal,
      });

    if (!processo) {
      throw new Error('Falha ao criar processo de débito.');
    }

    if (input.itens.length > 0) {
      await tx.insert(processoDebitoItens).values(
        input.itens.map((item) => ({
          processoDebitoId: processo.id,
          demandaId: item.demandaId,
          notaFiscalId: item.notaFiscalId ?? null,
          itemId: item.itemId ?? null,
          avariaId: item.avariaId ?? null,
          faltaPesoId: item.faltaPesoId ?? null,
          tipo: item.tipo,
          sku: item.sku ?? null,
          descricaoProduto: item.descricaoProduto ?? null,
          quantidade:
            item.quantidade != null ? String(item.quantidade) : null,
          pesoKg: item.pesoKg != null ? String(item.pesoKg) : null,
          valorUnitario:
            item.valorUnitario != null ? String(item.valorUnitario) : null,
          valorDebito: String(item.valorDebito ?? 0),
          motivo: item.motivo ?? null,
          observacao: item.observacao ?? null,
          status: 'cobrar' as const,
        })),
      );
    }

    await tx.insert(cobrancaEventos).values({
      entidadeTipo: 'processo',
      entidadeId: processo.id,
      statusAnterior: null,
      statusNovo: 'aberto',
      descricao: 'Processo de débito gerado automaticamente',
      criadoPorUserId: input.criadoPorUserId ?? null,
    });

    return {
      id: processo.id,
      demandaId: processo.demandaId,
      status: processo.status,
      quantidadeItens: processo.quantidadeItens,
      valorTotal: Number(processo.valorTotal),
    };
  });
}
