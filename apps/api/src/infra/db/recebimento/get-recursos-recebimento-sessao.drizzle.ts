import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { DemandaRecebimentoComAlocacao } from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/schemas/auth.schema.js';
import {
  docas,
  preRecebimentos,
  recebimentoAlocacoes,
  recebimentos,
} from '../providers/drizzle/config/migrations/schema.js';

const preDocas = alias(docas, 'pre_docas');
const alocacaoFuncionarios = alias(funcionarios, 'alocacao_funcionarios');
const conferenteFuncionarios = alias(funcionarios, 'conferente_funcionarios');

export async function getDemandasRecebimentoComAlocacaoDb(
  db: DrizzleClient,
  sessaoId: string,
  unidadeId: string,
): Promise<DemandaRecebimentoComAlocacao[]> {
  const rows = await db
    .select({
      preRecebimentoId: preRecebimentos.id,
      placa: preRecebimentos.placa,
      transportadoraNome: preRecebimentos.transportadoraNome,
      horarioPrevisto: preRecebimentos.horarioPrevisto,
      situacao: preRecebimentos.situacao,
      skuCount: sql<number>`(
        SELECT count(*)::int
        FROM recebimento.itens_pre_recebimento
        WHERE pre_recebimento_id = ${preRecebimentos.id}
      )`,
      empresas: sql<string[]>`(
        SELECT ARRAY(
          SELECT DISTINCT p.empresa
          FROM recebimento.itens_pre_recebimento ipr
          JOIN master_data.produtos p ON p.produto_id = ipr.produto_id
          WHERE ipr.pre_recebimento_id = ${preRecebimentos.id}
            AND p.empresa IS NOT NULL
          ORDER BY p.empresa
        )
      )`,
      categorias: sql<string[]>`(
        SELECT ARRAY(
          SELECT DISTINCT p.categoria
          FROM recebimento.itens_pre_recebimento ipr
          JOIN master_data.produtos p ON p.produto_id = ipr.produto_id
          WHERE ipr.pre_recebimento_id = ${preRecebimentos.id}
            AND p.categoria IS NOT NULL
          ORDER BY p.categoria
        )
      )`,
      recebimentoId: recebimentos.id,
      recebimentoDataInicio: recebimentos.dataInicio,
      docaCodigo: docas.codigo,
      preDocaCodigo: preDocas.codigo,
      alocacaoId: recebimentoAlocacoes.id,
      alocacaoStatus: recebimentoAlocacoes.status,
      alocacaoSessaoFuncionarioId: recebimentoAlocacoes.sessaoFuncionarioId,
      alocacaoFuncionarioId: recebimentoAlocacoes.funcionarioId,
      alocacaoFuncionarioNome: alocacaoFuncionarios.nome,
      alocacaoFuncionarioMatricula: alocacaoFuncionarios.matricula,
      alocacaoAtribuidoEm: recebimentoAlocacoes.atribuidoEm,
      conferenteId: recebimentos.responsavelId,
      conferenteNome: conferenteFuncionarios.nome,
    })
    .from(preRecebimentos)
    .leftJoin(
      recebimentos,
      eq(recebimentos.preRecebimentoId, preRecebimentos.id),
    )
    .leftJoin(
      recebimentoAlocacoes,
      and(
        eq(recebimentoAlocacoes.preRecebimentoId, preRecebimentos.id),
        eq(recebimentoAlocacoes.sessaoId, sessaoId),
        eq(recebimentoAlocacoes.papel, 'responsavel'),
        inArray(recebimentoAlocacoes.status, ['atribuida', 'iniciada']),
      ),
    )
    .leftJoin(
      alocacaoFuncionarios,
      eq(alocacaoFuncionarios.id, recebimentoAlocacoes.funcionarioId),
    )
    .leftJoin(
      conferenteFuncionarios,
      eq(conferenteFuncionarios.id, recebimentos.responsavelId),
    )
    .leftJoin(docas, eq(docas.id, recebimentos.docaId))
    .leftJoin(preDocas, eq(preDocas.id, preRecebimentos.docaId))
    .where(
      and(
        eq(preRecebimentos.unidadeId, unidadeId),
        or(
          and(
            eq(preRecebimentos.situacao, 'liberado_para_conferencia'),
            isNull(recebimentos.id),
          ),
          and(
            eq(preRecebimentos.situacao, 'liberado_para_conferencia'),
            eq(recebimentoAlocacoes.sessaoId, sessaoId),
          ),
          eq(preRecebimentos.situacao, 'em_conferencia'),
          eq(preRecebimentos.situacao, 'impedido'),
        ),
      ),
    )
    .orderBy(preRecebimentos.horarioPrevisto);

  return rows.map((row) => ({
    preRecebimentoId: row.preRecebimentoId,
    placa: row.placa ?? null,
    transportadoraNome: row.transportadoraNome ?? null,
    horarioPrevisto: row.horarioPrevisto,
    skuCount: row.skuCount ?? 0,
    dock: row.docaCodigo ?? row.preDocaCodigo ?? null,
    situacao: row.situacao,
    recebimentoId: row.recebimentoId ?? null,
    recebimentoDataInicio: row.recebimentoDataInicio ?? null,
    alocacaoId: row.alocacaoId ?? null,
    alocacaoStatus: row.alocacaoStatus ?? null,
    alocacaoSessaoFuncionarioId: row.alocacaoSessaoFuncionarioId ?? null,
    alocacaoFuncionarioId: row.alocacaoFuncionarioId ?? null,
    alocacaoFuncionarioNome: row.alocacaoFuncionarioNome ?? null,
    alocacaoFuncionarioMatricula: row.alocacaoFuncionarioMatricula ?? null,
    alocacaoAtribuidoEm: row.alocacaoAtribuidoEm ?? null,
    conferenteId: row.conferenteId ?? null,
    conferenteNome: row.conferenteNome ?? null,
    empresas: row.empresas ?? [],
    categorias: row.categorias ?? [],
  }));
}
