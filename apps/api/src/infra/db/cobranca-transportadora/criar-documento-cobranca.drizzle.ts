import { and, eq, inArray, sql } from 'drizzle-orm';

import type {
  CriarDocumentoCobrancaInput,
  CriarDocumentoCobrancaResult,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cobrancaEventos,
  documentoCobrancaItens,
  documentosCobranca,
  processoDebitoItens,
  processosDebito,
} from '../providers/drizzle/config/migrations/schema.js';

const MAX_TENTATIVAS_NUMERO = 3;

function formatarNumeroDocumento(sequencial: number): string {
  return `CD-${String(sequencial).padStart(6, '0')}`;
}

async function resolverProximoNumeroDocumento(
  tx: Parameters<Parameters<DrizzleClient['transaction']>[0]>[0],
  unidadeId: string,
  offsetTentativa: number,
): Promise<string> {
  const [countRow] = await tx
    .select({ total: sql<number>`count(*)::int` })
    .from(documentosCobranca)
    .where(eq(documentosCobranca.unidadeId, unidadeId));

  const sequencial = (countRow?.total ?? 0) + 1 + offsetTentativa;

  return formatarNumeroDocumento(sequencial);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('documentos_cobranca_unidade_numero_unique') ||
      error.message.includes('duplicate key'))
  );
}

export async function criarDocumentoCobrancaDb(
  db: DrizzleClient,
  input: CriarDocumentoCobrancaInput,
): Promise<CriarDocumentoCobrancaResult> {
  return db.transaction(async (tx) => {
    const processos = await tx
      .select({
        id: processosDebito.id,
        status: processosDebito.status,
        transportadoraId: processosDebito.transportadoraId,
        transportadoraNome: processosDebito.transportadoraNome,
      })
      .from(processosDebito)
      .where(
        and(
          inArray(processosDebito.id, input.processoDebitoIds),
          eq(processosDebito.unidadeId, input.unidadeId),
          eq(processosDebito.status, 'aprovado'),
        ),
      );

    if (processos.length !== input.processoDebitoIds.length) {
      throw new Error(
        'Todos os processos devem existir, pertencer à unidade e estar aprovados.',
      );
    }

    const transportadoraIds = new Set(
      processos.map((p) => p.transportadoraId ?? p.transportadoraNome),
    );

    if (transportadoraIds.size > 1) {
      throw new Error(
        'Todos os processos devem pertencer à mesma transportadora.',
      );
    }

    const itensProcesso = await tx
      .select({
        id: processoDebitoItens.id,
        processoDebitoId: processoDebitoItens.processoDebitoId,
        valorDebito: processoDebitoItens.valorDebito,
        status: processoDebitoItens.status,
      })
      .from(processoDebitoItens)
      .where(
        inArray(
          processoDebitoItens.processoDebitoId,
          input.processoDebitoIds,
        ),
      );

    const itensCobranca = itensProcesso.filter(
      (item) => item.status === 'cobrar',
    );

    if (itensCobranca.length === 0) {
      throw new Error(
        'Nenhum item marcado para cobrança encontrado nos processos.',
      );
    }

    const valorTotal = itensCobranca.reduce(
      (acc, item) => acc + Number(item.valorDebito),
      0,
    );

    const now = new Date();

    let documento:
      | {
          id: string;
          numeroDocumento: string;
          status: 'rascunho' | 'emitido' | 'enviado' | 'pago' | 'cancelado';
          valorTotal: string;
          quantidadeProcessos: number;
          quantidadeItens: number;
        }
      | undefined;

    let numeroDocumento = '';

    for (let tentativa = 0; tentativa < MAX_TENTATIVAS_NUMERO; tentativa++) {
      numeroDocumento = await resolverProximoNumeroDocumento(
        tx,
        input.unidadeId,
        tentativa,
      );

      try {
        const [inserted] = await tx
          .insert(documentosCobranca)
          .values({
            unidadeId: input.unidadeId,
            numeroDocumento,
            transportadoraId:
              input.transportadoraId ?? processos[0]?.transportadoraId ?? null,
            transportadoraNome: input.transportadoraNome,
            status: 'rascunho',
            valorTotal: String(valorTotal),
            quantidadeProcessos: processos.length,
            quantidadeItens: itensCobranca.length,
            observacao: input.observacao ?? null,
            emitidoPorUserId: input.emitidoPorUserId ?? null,
          })
          .returning({
            id: documentosCobranca.id,
            numeroDocumento: documentosCobranca.numeroDocumento,
            status: documentosCobranca.status,
            valorTotal: documentosCobranca.valorTotal,
            quantidadeProcessos: documentosCobranca.quantidadeProcessos,
            quantidadeItens: documentosCobranca.quantidadeItens,
          });

        documento = inserted;
        break;
      } catch (error) {
        if (!isUniqueViolation(error) || tentativa === MAX_TENTATIVAS_NUMERO - 1) {
          throw error;
        }
      }
    }

    if (!documento) {
      throw new Error('Falha ao criar documento de cobrança.');
    }

    await tx.insert(documentoCobrancaItens).values(
      itensCobranca.map((item) => ({
        documentoCobrancaId: documento.id,
        processoDebitoId: item.processoDebitoId,
        processoDebitoItemId: item.id,
        valorDebito: item.valorDebito,
      })),
    );

    await tx
      .update(processosDebito)
      .set({
        status: 'incluido_em_documento',
        updatedAt: now,
      })
      .where(inArray(processosDebito.id, input.processoDebitoIds));

    for (const processo of processos) {
      await tx.insert(cobrancaEventos).values({
        entidadeTipo: 'processo',
        entidadeId: processo.id,
        statusAnterior: processo.status,
        statusNovo: 'incluido_em_documento',
        descricao: `Incluído no documento ${numeroDocumento}`,
        criadoPorUserId: input.emitidoPorUserId ?? null,
      });
    }

    await tx.insert(cobrancaEventos).values({
      entidadeTipo: 'documento',
      entidadeId: documento.id,
      statusAnterior: null,
      statusNovo: 'rascunho',
      descricao: 'Documento de cobrança criado',
      criadoPorUserId: input.emitidoPorUserId ?? null,
    });

    return {
      id: documento.id,
      numeroDocumento: documento.numeroDocumento,
      status: documento.status,
      valorTotal: Number(documento.valorTotal),
      quantidadeProcessos: documento.quantidadeProcessos,
      quantidadeItens: documento.quantidadeItens,
    };
  });
}
