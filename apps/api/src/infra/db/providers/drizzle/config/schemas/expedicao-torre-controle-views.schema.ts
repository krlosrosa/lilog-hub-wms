import {
  boolean,
  date,
  integer,
  numeric,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { operacaoDocaPrioridadeEnum } from './doca.schema.js';
import { expedicaoPgSchema, mapaGrupoProcessoTypeEnum } from './expedicao.schema.js';

export const vwTransporteOperacional = expedicaoPgSchema
  .view('vw_transporte_operacional', {
    transporteId: uuid('transporte_id').notNull(),
    unidadeId: varchar('unidade_id', { length: 50 }).notNull(),
    uploadLoteId: uuid('upload_lote_id').notNull(),
    codigo: varchar('codigo', { length: 100 }).notNull(),
    placa: varchar('placa', { length: 20 }).notNull(),
    transportadora: varchar('transportadora', { length: 255 }).notNull(),
    horarioExpectativaSaida: timestamp('horario_expectativa_saida', {
      withTimezone: true,
    }),
    statusAlocacao: varchar('status_alocacao', { length: 20 }).notNull(),
    etapaAtual: varchar('etapa_atual', { length: 20 }).notNull(),
    mapasTotal: integer('mapas_total').notNull(),
    mapasConcluidos: integer('mapas_concluidos').notNull(),
    prioridade: boolean('prioridade').notNull(),
    isPrioridade: boolean('is_prioridade').notNull(),
    nivelPrioridade: operacaoDocaPrioridadeEnum('nivel_prioridade'),
    reentregaExclusiva: boolean('reentrega_exclusiva').notNull(),
    tempoRestanteSaidaMin: integer('tempo_restante_saida_min').notNull(),
    tempoRestanteSaidaSeg: integer('tempo_restante_saida_seg').notNull(),
  })
  .existing();

export const vwPipelineTurno = expedicaoPgSchema
  .view('vw_pipeline_turno', {
    unidadeId: varchar('unidade_id', { length: 50 }).notNull(),
    uploadLoteId: uuid('upload_lote_id').notNull(),
    processo: mapaGrupoProcessoTypeEnum('processo').notNull(),
    qtdMapasPendentes: integer('qtd_mapas_pendentes').notNull(),
    qtdMapasFinalizados: integer('qtd_mapas_finalizados').notNull(),
    tempoMedioParadoMin: numeric('tempo_medio_parado_min', {
      precision: 10,
      scale: 2,
    }).notNull(),
    volumeAcumuladoItens: integer('volume_acumulado_itens').notNull(),
  })
  .existing();

export const vwMapasPendentes = expedicaoPgSchema
  .view('vw_mapas_pendentes', {
    mapaGrupoId: uuid('mapa_grupo_id').notNull(),
    mapaLoteId: uuid('mapa_lote_id').notNull(),
    unidadeId: varchar('unidade_id', { length: 50 }).notNull(),
    uploadLoteId: uuid('upload_lote_id').notNull(),
    transporteId: uuid('transporte_id').notNull(),
    transporteCodigo: varchar('transporte_codigo', { length: 100 }).notNull(),
    microUuid: varchar('micro_uuid', { length: 120 }).notNull(),
    processo: mapaGrupoProcessoTypeEnum('processo').notNull(),
    titulo: varchar('titulo', { length: 255 }).notNull(),
    iniciadoEm: timestamp('iniciado_em', { withTimezone: true }),
    tempoEsperadoSeg: integer('tempo_esperado_seg').notNull(),
    tempoParadoSeg: integer('tempo_parado_seg').notNull(),
    operadorNome: varchar('operador_nome', { length: 100 }),
    sessaoFuncionarioId: uuid('sessao_funcionario_id'),
    prioridade: boolean('prioridade').notNull(),
    isPrioridade: boolean('is_prioridade').notNull(),
    nivelPrioridade: operacaoDocaPrioridadeEnum('nivel_prioridade'),
    reentregaExclusiva: boolean('reentrega_exclusiva').notNull(),
  })
  .existing();

export const vwTimelineFinalizacaoHora = expedicaoPgSchema
  .view('vw_timeline_finalizacao_hora', {
    unidadeId: varchar('unidade_id', { length: 50 }).notNull(),
    uploadLoteId: uuid('upload_lote_id').notNull(),
    horaBucket: timestamp('hora_bucket', { withTimezone: true }).notNull(),
    gruposFinalizados: integer('grupos_finalizados').notNull(),
  })
  .existing();

export const vwTurnoExpedicao = expedicaoPgSchema
  .view('vw_turno_expedicao', {
    uploadLoteId: uuid('upload_lote_id').notNull(),
    unidadeId: varchar('unidade_id', { length: 50 }).notNull(),
    dataReferencia: date('data_referencia').notNull(),
    horarioExpectativaSaida: timestamp('horario_expectativa_saida', {
      withTimezone: true,
    }).notNull(),
    turnoInicioEm: timestamp('turno_inicio_em', { withTimezone: true }).notNull(),
    totalTransportes: integer('total_transportes').notNull(),
    transportesFinalizados: integer('transportes_finalizados').notNull(),
    mapasPendentes: integer('mapas_pendentes').notNull(),
    mapasFinalizados: integer('mapas_finalizados').notNull(),
    pesoTotalKg: numeric('peso_total_kg', { precision: 12, scale: 3 }).notNull(),
    pesoFinalizadoKg: numeric('peso_finalizado_kg', {
      precision: 12,
      scale: 3,
    }).notNull(),
  })
  .existing();

export type VwTransporteOperacionalRow = typeof vwTransporteOperacional.$inferSelect;
export type VwPipelineTurnoRow = typeof vwPipelineTurno.$inferSelect;
export type VwMapasPendentesRow = typeof vwMapasPendentes.$inferSelect;
export type VwTimelineFinalizacaoHoraRow =
  typeof vwTimelineFinalizacaoHora.$inferSelect;
export type VwTurnoExpedicaoRow = typeof vwTurnoExpedicao.$inferSelect;
