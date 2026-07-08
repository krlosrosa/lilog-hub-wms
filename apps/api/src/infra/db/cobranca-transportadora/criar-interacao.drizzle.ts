import { and, asc, desc, eq } from 'drizzle-orm';

import type {
  CriarInteracaoInput,
  InteracaoAutor,
  InteracaoRecord,
  InteracaoTipo,
} from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  cobrancaEventos,
  processoDebitoInteracoes,
  processosDebito,
} from '../providers/drizzle/config/migrations/schema.js';

function toAnexoChaves(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function mapInteracaoRow(row: {
  id: string;
  processoDebitoId: string;
  autor: InteracaoAutor;
  tipo: InteracaoTipo;
  descricao: string;
  anexoChaves: unknown;
  transportadoraId: string | null;
  criadoPorUserId: number | null;
  createdAt: Date;
}): InteracaoRecord {
  return {
    id: row.id,
    processoDebitoId: row.processoDebitoId,
    autor: row.autor,
    tipo: row.tipo,
    descricao: row.descricao,
    anexoChaves: toAnexoChaves(row.anexoChaves),
    transportadoraId: row.transportadoraId,
    criadoPorUserId: row.criadoPorUserId,
    createdAt: row.createdAt,
  };
}

function descricaoEventoInteracao(
  autor: InteracaoAutor,
  tipo: InteracaoTipo,
  quantidadeAnexos: number,
): string {
  const sufixoAnexos = `${quantidadeAnexos} anexo${quantidadeAnexos === 1 ? '' : 's'}`;

  if (autor === 'transportadora') {
    return `Interação da transportadora enviada (${sufixoAnexos})`;
  }

  if (tipo === 'solicitacao_prova') {
    return `Solicitação de prova enviada pelo CD (${sufixoAnexos})`;
  }

  if (tipo === 'parecer') {
    return `Parecer do CD enviado (${sufixoAnexos})`;
  }

  return `Observação do CD enviada (${sufixoAnexos})`;
}

export async function criarInteracaoDb(
  db: DrizzleClient,
  input: CriarInteracaoInput,
): Promise<InteracaoRecord> {
  return db.transaction(async (tx) => {
    const whereClause =
      input.autor === 'transportadora' && input.transportadoraId
        ? and(
            eq(processosDebito.id, input.processoDebitoId),
            eq(processosDebito.transportadoraId, input.transportadoraId),
          )
        : input.unidadeId
          ? and(
              eq(processosDebito.id, input.processoDebitoId),
              eq(processosDebito.unidadeId, input.unidadeId),
            )
          : eq(processosDebito.id, input.processoDebitoId);

    const [processo] = await tx
      .select({
        id: processosDebito.id,
        status: processosDebito.status,
        transportadoraId: processosDebito.transportadoraId,
      })
      .from(processosDebito)
      .where(whereClause)
      .limit(1);

    if (!processo) {
      throw new Error('PROCESSO_NAO_ENCONTRADO');
    }

    const [interacao] = await tx
      .insert(processoDebitoInteracoes)
      .values({
        processoDebitoId: input.processoDebitoId,
        autor: input.autor,
        tipo: input.tipo,
        descricao: input.descricao,
        anexoChaves: input.anexoChaves,
        transportadoraId:
          input.autor === 'transportadora'
            ? (input.transportadoraId ?? processo.transportadoraId)
            : null,
        criadoPorUserId: input.criadoPorUserId ?? null,
      })
      .returning({
        id: processoDebitoInteracoes.id,
        processoDebitoId: processoDebitoInteracoes.processoDebitoId,
        autor: processoDebitoInteracoes.autor,
        tipo: processoDebitoInteracoes.tipo,
        descricao: processoDebitoInteracoes.descricao,
        anexoChaves: processoDebitoInteracoes.anexoChaves,
        transportadoraId: processoDebitoInteracoes.transportadoraId,
        criadoPorUserId: processoDebitoInteracoes.criadoPorUserId,
        createdAt: processoDebitoInteracoes.createdAt,
      });

    if (!interacao) {
      throw new Error('FALHA_CRIAR_INTERACAO');
    }

    const quantidadeAnexos = input.anexoChaves.length;
    const descricaoEvento = descricaoEventoInteracao(
      input.autor,
      input.tipo,
      quantidadeAnexos,
    );

    if (input.autor === 'transportadora' && processo.status === 'aberto') {
      const now = new Date();

      await tx
        .update(processosDebito)
        .set({
          status: 'em_analise',
          updatedAt: now,
        })
        .where(eq(processosDebito.id, input.processoDebitoId));

      await tx.insert(cobrancaEventos).values({
        entidadeTipo: 'processo',
        entidadeId: input.processoDebitoId,
        statusAnterior: processo.status,
        statusNovo: 'em_analise',
        descricao: descricaoEvento,
        criadoPorUserId: input.criadoPorUserId ?? null,
      });
    } else {
      await tx.insert(cobrancaEventos).values({
        entidadeTipo: 'processo',
        entidadeId: input.processoDebitoId,
        statusAnterior: processo.status,
        statusNovo: processo.status,
        descricao: descricaoEvento,
        criadoPorUserId: input.criadoPorUserId ?? null,
      });
    }

    return mapInteracaoRow(interacao);
  });
}

export async function listarInteracoesDb(
  db: DrizzleClient,
  processoDebitoId: string,
): Promise<InteracaoRecord[]> {
  const rows = await db
    .select({
      id: processoDebitoInteracoes.id,
      processoDebitoId: processoDebitoInteracoes.processoDebitoId,
      autor: processoDebitoInteracoes.autor,
      tipo: processoDebitoInteracoes.tipo,
      descricao: processoDebitoInteracoes.descricao,
      anexoChaves: processoDebitoInteracoes.anexoChaves,
      transportadoraId: processoDebitoInteracoes.transportadoraId,
      criadoPorUserId: processoDebitoInteracoes.criadoPorUserId,
      createdAt: processoDebitoInteracoes.createdAt,
    })
    .from(processoDebitoInteracoes)
    .where(eq(processoDebitoInteracoes.processoDebitoId, processoDebitoId))
    .orderBy(asc(processoDebitoInteracoes.createdAt));

  return rows.map(mapInteracaoRow);
}
