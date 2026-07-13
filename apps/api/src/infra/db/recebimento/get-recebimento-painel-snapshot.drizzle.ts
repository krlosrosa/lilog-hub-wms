import { and, eq, gte, inArray, lte, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type {
  RecebimentoPainelFiltro,
  RecebimentoPainelReadModel,
} from '../../../domain/repositories/recebimento/recebimento-painel.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/schemas/auth.schema.js';
import { naoConformidades, cncItens } from '../providers/drizzle/config/schemas/cnc.schema.js';
import { docas } from '../providers/drizzle/config/schemas/doca.schema.js';
import { centros } from '../providers/drizzle/config/schemas/master-data.schema.js';
import {
  divergenciasRecebimento,
  itensPreRecebimento,
  notasFiscaisPreRecebimento,
  preRecebimentos,
  recebimentos,
} from '../providers/drizzle/config/schemas/recebimento.schema.js';
import { getProdutividadeOperadoresRecebimentoDb } from './get-produtividade-operadores-recebimento.drizzle.js';

const recebimentoDocas = alias(docas, 'recebimento_docas');
const preDocas = alias(docas, 'pre_docas');
const conferenteFuncionarios = alias(funcionarios, 'conferente_funcionarios');

function normalizarOrigemCodigo(origem: string | null): string {
  const trimmed = origem?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : '3201';
}

function parseNumeric(value: string | number | null | undefined): number {
  if (value == null) {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extrairNumeroDoca(codigo: string, fallback: number): number {
  const digits = codigo.replace(/\D/g, '');
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function getRecebimentoPainelSnapshotDb(
  db: DrizzleClient,
  filtro: RecebimentoPainelFiltro,
): Promise<RecebimentoPainelReadModel> {
  const dateFilter = and(
    eq(preRecebimentos.unidadeId, filtro.unidadeId),
    gte(preRecebimentos.horarioPrevisto, filtro.dataInicio),
    lte(preRecebimentos.horarioPrevisto, filtro.dataFim),
  );

  const preRows = await db
    .select({
      id: preRecebimentos.id,
      placa: preRecebimentos.placa,
      transportadoraNome: preRecebimentos.transportadoraNome,
      horarioPrevisto: preRecebimentos.horarioPrevisto,
      situacao: preRecebimentos.situacao,
      grauPrioridade: preRecebimentos.grauPrioridade,
      recebimentoId: recebimentos.id,
      recebimentoDataInicio: recebimentos.dataInicio,
      recebimentoDataFim: recebimentos.dataFim,
      docaCodigo: sql<string | null>`coalesce(${recebimentoDocas.codigo}, ${preDocas.codigo})`,
      conferenteNome: conferenteFuncionarios.nome,
      skuCount: sql<number>`(
        SELECT count(*)::int
        FROM recebimento.itens_pre_recebimento
        WHERE pre_recebimento_id = ${preRecebimentos.id}
      )`,
      volumeUn: sql<number>`(
        SELECT coalesce(sum(${itensPreRecebimento.quantidadeEsperada}), 0)::float8
        FROM recebimento.itens_pre_recebimento
        WHERE pre_recebimento_id = ${preRecebimentos.id}
      )`,
    })
    .from(preRecebimentos)
    .leftJoin(
      recebimentos,
      eq(recebimentos.preRecebimentoId, preRecebimentos.id),
    )
    .leftJoin(
      recebimentoDocas,
      eq(recebimentoDocas.id, recebimentos.docaId),
    )
    .leftJoin(preDocas, eq(preDocas.id, preRecebimentos.docaId))
    .leftJoin(
      conferenteFuncionarios,
      eq(conferenteFuncionarios.id, recebimentos.responsavelId),
    )
    .where(dateFilter)
    .orderBy(preRecebimentos.horarioPrevisto);

  const preIds = preRows.map((row) => row.id);

  const empresasRows =
    preIds.length > 0
      ? await db
          .select({
            preRecebimentoId: notasFiscaisPreRecebimento.preRecebimentoId,
            fornecedorNome: notasFiscaisPreRecebimento.fornecedorNome,
            pesoTotal: notasFiscaisPreRecebimento.pesoTotal,
          })
          .from(notasFiscaisPreRecebimento)
          .where(inArray(notasFiscaisPreRecebimento.preRecebimentoId, preIds))
      : [];

  const pesoItensRows =
    preIds.length > 0
      ? await db
          .select({
            preRecebimentoId: itensPreRecebimento.preRecebimentoId,
            pesoKg: sql<number>`coalesce(sum(${itensPreRecebimento.pesoEsperado}), 0)::float8`,
          })
          .from(itensPreRecebimento)
          .where(inArray(itensPreRecebimento.preRecebimentoId, preIds))
          .groupBy(itensPreRecebimento.preRecebimentoId)
      : [];

  const pesoItensPorPre = new Map(
    pesoItensRows.map((row) => [row.preRecebimentoId, parseNumeric(row.pesoKg)]),
  );

  const empresasPorPre = new Map<string, Set<string>>();

  for (const row of empresasRows) {
    const nome =
      row.fornecedorNome?.trim() ||
      preRows.find((pre) => pre.id === row.preRecebimentoId)?.transportadoraNome?.trim() ||
      'Sem empresa';

    const atual = empresasPorPre.get(row.preRecebimentoId) ?? new Set<string>();
    atual.add(nome);
    empresasPorPre.set(row.preRecebimentoId, atual);
  }

  const prePorId = new Map(preRows.map((pre) => [pre.id, pre]));
  const empresaRecebimentos: RecebimentoPainelReadModel['empresaRecebimentos'] =
    [];
  const preComNf = new Set<string>();

  for (const row of empresasRows) {
    const pre = prePorId.get(row.preRecebimentoId);
    if (!pre) continue;

    preComNf.add(row.preRecebimentoId);
    const empresa =
      row.fornecedorNome?.trim() ||
      pre.transportadoraNome?.trim() ||
      'Sem empresa';
    const pesoNf = parseNumeric(row.pesoTotal);
    const pesoItens = pesoItensPorPre.get(row.preRecebimentoId) ?? 0;

    empresaRecebimentos.push({
      preRecebimentoId: row.preRecebimentoId,
      empresa,
      pesoKg: pesoNf > 0 ? pesoNf : pesoItens,
      situacao: pre.situacao,
    });
  }

  for (const pre of preRows) {
    if (preComNf.has(pre.id)) continue;

    empresaRecebimentos.push({
      preRecebimentoId: pre.id,
      empresa:
        pre.transportadoraNome?.trim() ||
        empresasPorPre.get(pre.id)?.values().next().value ||
        'Sem empresa',
      pesoKg: pesoItensPorPre.get(pre.id) ?? 0,
      situacao: pre.situacao,
    });
  }

  const docaRows = await db
    .select({
      id: docas.id,
      codigo: docas.codigo,
      situacao: docas.situacao,
      capacidadeVeiculos: docas.capacidadeVeiculos,
      observacao: docas.observacao,
      placaOcupando: preRecebimentos.placa,
      ocupacaoInicio: recebimentos.dataInicio,
      grauPrioridade: preRecebimentos.grauPrioridade,
    })
    .from(docas)
    .leftJoin(
      recebimentos,
      and(
        eq(recebimentos.docaId, docas.id),
        inArray(recebimentos.situacao, ['em_conferencia', 'conferido']),
      ),
    )
    .leftJoin(
      preRecebimentos,
      eq(preRecebimentos.id, recebimentos.preRecebimentoId),
    )
    .where(
      and(
        eq(docas.unidadeId, filtro.unidadeId),
        or(eq(docas.tipo, 'recebimento'), eq(docas.tipo, 'compartilhada')),
      ),
    )
    .orderBy(docas.codigo);

  const docasUnicas = new Map<string, (typeof docaRows)[number]>();

  for (const row of docaRows) {
    if (!docasUnicas.has(row.id)) {
      docasUnicas.set(row.id, row);
      continue;
    }

    if (row.placaOcupando) {
      docasUnicas.set(row.id, row);
    }
  }

  const anomaliaRows = await db
    .select({
      id: cncItens.id,
      subtipoOcorrencia: cncItens.subtipoOcorrencia,
      origem: preRecebimentos.origem,
      placa: preRecebimentos.placa,
      recebimentoId: recebimentos.id,
      preRecebimentoId: preRecebimentos.id,
      createdAt: naoConformidades.createdAt,
    })
    .from(cncItens)
    .innerJoin(naoConformidades, eq(naoConformidades.id, cncItens.cncId))
    .innerJoin(recebimentos, eq(recebimentos.id, naoConformidades.origemId))
    .innerJoin(
      preRecebimentos,
      eq(preRecebimentos.id, recebimentos.preRecebimentoId),
    )
    .where(
      and(
        eq(naoConformidades.origem, 'recebimento'),
        eq(preRecebimentos.unidadeId, filtro.unidadeId),
        gte(naoConformidades.createdAt, filtro.dataInicio),
        lte(naoConformidades.createdAt, filtro.dataFim),
      ),
    )
    .orderBy(sql`${naoConformidades.createdAt} desc`);

  const origensUnicas = [
    ...new Set(anomaliaRows.map((row) => normalizarOrigemCodigo(row.origem))),
  ];

  const centrosRows =
    origensUnicas.length > 0
      ? await db
          .select({
            centro: centros.centro,
            nome: centros.nome,
          })
          .from(centros)
          .where(
            or(
              ...origensUnicas.map(
                (origem) => sql`trim(${centros.centro}) = ${origem}`,
              ),
            ),
          )
      : [];

  const [divergenciasCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(divergenciasRecebimento)
    .innerJoin(recebimentos, eq(recebimentos.id, divergenciasRecebimento.recebimentoId))
    .innerJoin(
      preRecebimentos,
      eq(preRecebimentos.id, recebimentos.preRecebimentoId),
    )
    .where(
      and(
        eq(preRecebimentos.unidadeId, filtro.unidadeId),
        gte(preRecebimentos.horarioPrevisto, filtro.dataInicio),
        lte(preRecebimentos.horarioPrevisto, filtro.dataFim),
      ),
    );

  const [cncGeradasCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(naoConformidades)
    .where(
      and(
        eq(naoConformidades.unidadeId, filtro.unidadeId),
        eq(naoConformidades.origem, 'recebimento'),
        gte(naoConformidades.createdAt, filtro.dataInicio),
        lte(naoConformidades.createdAt, filtro.dataFim),
      ),
    );

  const [finalizadosPorHoraRows, produtividadeOperadores] = await Promise.all([
    db
      .select({
        hora: sql<number>`extract(hour from ${recebimentos.dataFim})::int`,
        finalizados: sql<number>`count(*)::int`,
        volumeUn: sql<number>`coalesce(sum((
        SELECT coalesce(sum(${itensPreRecebimento.quantidadeEsperada}), 0)::float8
        FROM recebimento.itens_pre_recebimento
        WHERE pre_recebimento_id = ${preRecebimentos.id}
      )), 0)::float8`,
      })
      .from(recebimentos)
      .innerJoin(
        preRecebimentos,
        eq(preRecebimentos.id, recebimentos.preRecebimentoId),
      )
      .where(
        and(
          eq(preRecebimentos.unidadeId, filtro.unidadeId),
          eq(recebimentos.situacao, 'finalizado'),
          sql`${recebimentos.dataFim} is not null`,
          gte(recebimentos.dataFim, filtro.dataInicio),
          lte(recebimentos.dataFim, filtro.dataFim),
        ),
      )
      .groupBy(sql`extract(hour from ${recebimentos.dataFim})`),
    getProdutividadeOperadoresRecebimentoDb(db, filtro),
  ]);

  return {
    preRecebimentos: preRows.map((row) => ({
      id: row.id,
      placa: row.placa,
      transportadoraNome: row.transportadoraNome,
      horarioPrevisto: row.horarioPrevisto,
      situacao: row.situacao,
      grauPrioridade: row.grauPrioridade,
      recebimentoId: row.recebimentoId,
      recebimentoDataInicio: row.recebimentoDataInicio,
      recebimentoDataFim: row.recebimentoDataFim,
      docaCodigo: row.docaCodigo,
      conferenteNome: row.conferenteNome,
      skuCount: row.skuCount ?? 0,
      volumeUn: parseNumeric(row.volumeUn),
      empresas: [...(empresasPorPre.get(row.id) ?? new Set(['Sem empresa']))],
    })),
    empresaRecebimentos,
    docas: [...docasUnicas.values()].map((row) => ({
      id: row.id,
      codigo: row.codigo,
      situacao: row.situacao,
      capacidadeVeiculos: row.capacidadeVeiculos,
      observacao: row.observacao,
      placaOcupando: row.placaOcupando,
      ocupacaoInicio: row.ocupacaoInicio,
      grauPrioridade: row.grauPrioridade,
    })),
    anomalias: anomaliaRows.map((row) => ({
      id: row.id,
      subtipoOcorrencia: row.subtipoOcorrencia,
      origem: row.origem,
      placa: row.placa,
      recebimentoId: row.recebimentoId,
      preRecebimentoId: row.preRecebimentoId,
      createdAt: row.createdAt,
    })),
    centros: centrosRows.map((row) => ({
      centro: row.centro.trim(),
      nome: row.nome,
    })),
    divergenciasCount: divergenciasCountRow?.count ?? 0,
    cncGeradasCount: cncGeradasCountRow?.count ?? 0,
    finalizadosPorHora: finalizadosPorHoraRows.map((row) => ({
      hora: row.hora ?? 0,
      finalizados: row.finalizados ?? 0,
      volumeUn: parseNumeric(row.volumeUn),
    })),
    produtividadeOperadores,
  };
}

export function extrairNumeroDocaPainel(codigo: string, fallback: number): number {
  return extrairNumeroDoca(codigo, fallback);
}
