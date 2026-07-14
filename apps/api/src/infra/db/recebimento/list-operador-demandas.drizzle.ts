import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { ListOperadorDemandasFilter } from '../../../domain/repositories/recebimento/conferencia.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/schemas/auth.schema.js';
import {
  docas,
  preRecebimentos,
  recebimentoAlocacoes,
  recebimentos,
} from '../providers/drizzle/config/migrations/schema.js';

const preDocas = alias(docas, 'pre_docas');

function buildApoioAtivoExists(funcionarioId: number) {
  return sql`exists (
    select 1
    from recebimento.alocacoes apoio_aloc
    where apoio_aloc.pre_recebimento_id = ${preRecebimentos.id}
      and apoio_aloc.funcionario_id = ${funcionarioId}
      and apoio_aloc.papel = 'apoio'
      and apoio_aloc.status in ('atribuida', 'iniciada')
  )`;
}

function buildApoioAlocacaoIdSubquery(funcionarioId: number) {
  return sql<string | null>`(
    select apoio_aloc.id
    from recebimento.alocacoes apoio_aloc
    where apoio_aloc.pre_recebimento_id = ${preRecebimentos.id}
      and apoio_aloc.funcionario_id = ${funcionarioId}
      and apoio_aloc.papel = 'apoio'
      and apoio_aloc.status in ('atribuida', 'iniciada')
    limit 1
  )`;
}

function buildSituacaoCondition(filter: ListOperadorDemandasFilter) {
  const liberadoSemRecebimento = and(
    eq(preRecebimentos.situacao, 'liberado_para_conferencia'),
    isNull(recebimentos.id),
  );

  const disponivelParaOperador =
    filter.responsavelId != null
      ? and(
          liberadoSemRecebimento,
          or(
            isNull(recebimentoAlocacoes.id),
            eq(recebimentoAlocacoes.funcionarioId, filter.responsavelId),
          ),
        )
      : liberadoSemRecebimento;

  if (!filter.responsavelId) {
    return disponivelParaOperador;
  }

  const conferenciaDoOperador = and(
    eq(recebimentos.responsavelId, filter.responsavelId),
    or(
      eq(preRecebimentos.situacao, 'em_conferencia'),
      eq(recebimentos.situacao, 'em_conferencia'),
    ),
  );

  const apoioDoOperador = and(
    buildApoioAtivoExists(filter.responsavelId),
    or(
      eq(preRecebimentos.situacao, 'liberado_para_conferencia'),
      eq(preRecebimentos.situacao, 'em_conferencia'),
    ),
  );

  const impedidoParaOperador = and(
    eq(preRecebimentos.situacao, 'impedido'),
    or(
      isNull(recebimentoAlocacoes.id),
      eq(recebimentoAlocacoes.funcionarioId, filter.responsavelId),
      eq(recebimentos.responsavelId, filter.responsavelId),
      buildApoioAtivoExists(filter.responsavelId),
    ),
  );

  return or(
    disponivelParaOperador,
    conferenciaDoOperador,
    apoioDoOperador,
    impedidoParaOperador,
  );
}

export async function listOperadorDemandasDb(
  db: DrizzleClient,
  filter: ListOperadorDemandasFilter,
) {
  const conditions = [buildSituacaoCondition(filter)];

  if (filter.unidadeId) {
    conditions.push(eq(preRecebimentos.unidadeId, filter.unidadeId));
  }

  const rows = await db
    .select({
      preRecebimento: preRecebimentos,
      recebimento: recebimentos,
      docaCodigo: docas.codigo,
      preDocaCodigo: preDocas.codigo,
      responsavelId: recebimentos.responsavelId,
      responsavelNome: funcionarios.nome,
      responsavelMatricula: funcionarios.matricula,
      skuCount: sql<number>`(
        SELECT count(*)::int
        FROM recebimento.itens_pre_recebimento
        WHERE pre_recebimento_id = ${preRecebimentos.id}
      )`,
      alocacaoFuncionarioId: recebimentoAlocacoes.funcionarioId,
      souApoio: filter.responsavelId
        ? buildApoioAtivoExists(filter.responsavelId)
        : sql<boolean>`false`,
      apoioAlocacaoId: filter.responsavelId
        ? buildApoioAlocacaoIdSubquery(filter.responsavelId)
        : sql<string | null>`null`,
    })
    .from(preRecebimentos)
    .leftJoin(
      recebimentos,
      eq(recebimentos.preRecebimentoId, preRecebimentos.id),
    )
    .leftJoin(funcionarios, eq(recebimentos.responsavelId, funcionarios.id))
    .leftJoin(docas, eq(recebimentos.docaId, docas.id))
    .leftJoin(preDocas, eq(preRecebimentos.docaId, preDocas.id))
    .leftJoin(
      recebimentoAlocacoes,
      and(
        eq(recebimentoAlocacoes.preRecebimentoId, preRecebimentos.id),
        eq(recebimentoAlocacoes.papel, 'responsavel'),
        eq(recebimentoAlocacoes.status, 'atribuida'),
      ),
    )
    .where(and(...conditions))
    .orderBy(preRecebimentos.horarioPrevisto);

  return rows.map(
    ({
      preRecebimento,
      recebimento,
      docaCodigo,
      preDocaCodigo,
      responsavelId,
      responsavelNome,
      responsavelMatricula,
      skuCount,
      alocacaoFuncionarioId,
      souApoio,
      apoioAlocacaoId,
    }) => ({
      preRecebimentoId: preRecebimento.id,
      recebimentoId: recebimento?.id ?? null,
      unidadeId: preRecebimento.unidadeId,
      placa: preRecebimento.placa,
      transportadoraNome: preRecebimento.transportadoraNome,
      situacao: preRecebimento.situacao,
      dock: docaCodigo ?? preDocaCodigo ?? null,
      skuCount: skuCount ?? 0,
      horarioPrevisto: preRecebimento.horarioPrevisto,
      conferenteId: responsavelId ?? null,
      conferente: responsavelNome ?? null,
      conferenteMatricula: responsavelMatricula ?? null,
      alocacaoFuncionarioId: alocacaoFuncionarioId ?? null,
      souApoio: Boolean(souApoio),
      apoioAlocacaoId: apoioAlocacaoId ?? null,
    }),
  );
}
