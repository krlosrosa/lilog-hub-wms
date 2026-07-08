import { and, asc, eq } from 'drizzle-orm';

import type { DocumentoCobrancaDetalheRecord } from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cobrancaEventos,
  demandasDevolucao,
  documentoCobrancaItens,
  documentosCobranca,
  processoDebitoItens,
} from '../providers/drizzle/config/migrations/schema.js';

export async function buscarDocumentoCobrancaDetalheDb(
  db: DrizzleClient,
  documentoId: string,
  unidadeId: string,
): Promise<DocumentoCobrancaDetalheRecord | null> {
  const [docRow] = await db
    .select()
    .from(documentosCobranca)
    .where(
      and(
        eq(documentosCobranca.id, documentoId),
        eq(documentosCobranca.unidadeId, unidadeId),
      ),
    )
    .limit(1);

  if (!docRow) return null;

  const itemRows = await db
    .select({
      id: documentoCobrancaItens.id,
      documentoCobrancaId: documentoCobrancaItens.documentoCobrancaId,
      processoDebitoId: documentoCobrancaItens.processoDebitoId,
      processoDebitoItemId: documentoCobrancaItens.processoDebitoItemId,
      valorDebito: documentoCobrancaItens.valorDebito,
      demandaId: processoDebitoItens.demandaId,
      codigoDemanda: demandasDevolucao.codigoDemanda,
      sku: processoDebitoItens.sku,
      tipo: processoDebitoItens.tipo,
      createdAt: documentoCobrancaItens.createdAt,
    })
    .from(documentoCobrancaItens)
    .innerJoin(
      processoDebitoItens,
      eq(
        documentoCobrancaItens.processoDebitoItemId,
        processoDebitoItens.id,
      ),
    )
    .innerJoin(
      demandasDevolucao,
      eq(processoDebitoItens.demandaId, demandasDevolucao.id),
    )
    .where(eq(documentoCobrancaItens.documentoCobrancaId, documentoId))
    .orderBy(asc(documentoCobrancaItens.createdAt));

  const eventoRows = await db
    .select()
    .from(cobrancaEventos)
    .where(
      and(
        eq(cobrancaEventos.entidadeTipo, 'documento'),
        eq(cobrancaEventos.entidadeId, documentoId),
      ),
    )
    .orderBy(asc(cobrancaEventos.createdAt));

  return {
    id: docRow.id,
    unidadeId: docRow.unidadeId,
    numeroDocumento: docRow.numeroDocumento,
    transportadoraId: docRow.transportadoraId,
    transportadoraNome: docRow.transportadoraNome,
    status: docRow.status,
    valorTotal: Number(docRow.valorTotal),
    quantidadeProcessos: docRow.quantidadeProcessos,
    quantidadeItens: docRow.quantidadeItens,
    observacao: docRow.observacao,
    emitidoEm: docRow.emitidoEm,
    enviadoEm: docRow.enviadoEm,
    pagoEm: docRow.pagoEm,
    createdAt: docRow.createdAt,
    updatedAt: docRow.updatedAt,
    itens: itemRows.map((item) => ({
      id: item.id,
      documentoCobrancaId: item.documentoCobrancaId,
      processoDebitoId: item.processoDebitoId,
      processoDebitoItemId: item.processoDebitoItemId,
      valorDebito: Number(item.valorDebito),
      demandaId: item.demandaId,
      codigoDemanda: item.codigoDemanda,
      sku: item.sku,
      tipo: item.tipo,
      createdAt: item.createdAt,
    })),
    eventos: eventoRows.map((evento) => ({
      id: evento.id,
      entidadeTipo: evento.entidadeTipo,
      entidadeId: evento.entidadeId,
      statusAnterior: evento.statusAnterior,
      statusNovo: evento.statusNovo,
      descricao: evento.descricao,
      criadoPorUserId: evento.criadoPorUserId,
      criadoPorNome: null,
      createdAt: evento.createdAt,
    })),
  };
}
