import { and, asc, eq } from 'drizzle-orm';

import type {
  TorreControleFiltro,
  TorreControleReadModel,
} from '../../../../domain/repositories/expedicao/torre-controle.repository.js';
import type { DrizzleClient } from '../../providers/drizzle/drizzle.provider.js';
import { listarMapasOperacionaisTorreDb } from './listar-mapas-operacionais-torre.drizzle.js';
import { totalPaletesTransportesDb } from '../total-paletes-transporte.drizzle.js';
import {
  mapaGrupos,
  vwMapasPendentes,
  vwPipelineTurno,
  vwTimelineFinalizacaoHora,
  vwTransporteOperacional,
  vwTurnoExpedicao,
  transportes,
  docas,
} from '../../providers/drizzle/config/migrations/schema.js';

function parsePesoKg(value: string | null | undefined): number {
  if (value == null || value === '') {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function obterTorreControleReadModelDb(
  db: DrizzleClient,
  filtro: TorreControleFiltro,
): Promise<TorreControleReadModel> {
  const filtroBase = {
    unidadeId: filtro.unidadeId,
    uploadLoteId: filtro.uploadLoteId,
  };

  const [
    turnoRows,
    transportesRows,
    viagemRows,
    pipeline,
    mapasPendentes,
    mapasOperacionais,
    mapasHorarios,
    timeline,
    paletesPorTransporte,
  ] = await Promise.all([
      db
        .select()
        .from(vwTurnoExpedicao)
        .where(
          and(
            eq(vwTurnoExpedicao.unidadeId, filtro.unidadeId),
            eq(vwTurnoExpedicao.uploadLoteId, filtro.uploadLoteId),
          ),
        )
        .limit(1),
      db
        .select()
        .from(vwTransporteOperacional)
        .where(
          and(
            eq(vwTransporteOperacional.unidadeId, filtro.unidadeId),
            eq(vwTransporteOperacional.uploadLoteId, filtro.uploadLoteId),
          ),
        )
        .orderBy(asc(vwTransporteOperacional.horarioExpectativaSaida)),
      db
        .select({
          id: transportes.id,
          viagemId: transportes.viagemId,
          viagemInicioEm: transportes.viagemInicioEm,
          viagemFimEm: transportes.viagemFimEm,
          anomalia: transportes.anomalia,
          pesoTotal: transportes.pesoTotal,
          docaId: transportes.docaId,
          lacreCarregamento: transportes.lacreCarregamento,
          docaCodigo: docas.codigo,
        })
        .from(transportes)
        .leftJoin(docas, eq(transportes.docaId, docas.id))
        .where(
          and(
            eq(transportes.unidadeId, filtro.unidadeId),
            eq(transportes.uploadLoteId, filtro.uploadLoteId),
          ),
        ),
      db
        .select()
        .from(vwPipelineTurno)
        .where(
          and(
            eq(vwPipelineTurno.unidadeId, filtro.unidadeId),
            eq(vwPipelineTurno.uploadLoteId, filtro.uploadLoteId),
          ),
        ),
      db
        .select()
        .from(vwMapasPendentes)
        .where(
          and(
            eq(vwMapasPendentes.unidadeId, filtro.unidadeId),
            eq(vwMapasPendentes.uploadLoteId, filtro.uploadLoteId),
          ),
        )
        .orderBy(asc(vwMapasPendentes.tempoParadoSeg)),
      listarMapasOperacionaisTorreDb(db, filtroBase),
      db
        .select({
          transporteId: mapaGrupos.transporteId,
          processo: mapaGrupos.processo,
          iniciadoEm: mapaGrupos.iniciadoEm,
          finalizadoEm: mapaGrupos.finalizadoEm,
        })
        .from(mapaGrupos)
        .innerJoin(transportes, eq(mapaGrupos.transporteId, transportes.id))
        .where(
          and(
            eq(transportes.unidadeId, filtro.unidadeId),
            eq(transportes.uploadLoteId, filtro.uploadLoteId),
          ),
        ),
      db
        .select()
        .from(vwTimelineFinalizacaoHora)
        .where(
          and(
            eq(vwTimelineFinalizacaoHora.unidadeId, filtro.unidadeId),
            eq(vwTimelineFinalizacaoHora.uploadLoteId, filtro.uploadLoteId),
          ),
        )
        .orderBy(asc(vwTimelineFinalizacaoHora.horaBucket)),
    totalPaletesTransportesDb(db, {
      unidadeId: filtro.unidadeId,
      uploadLoteId: filtro.uploadLoteId,
    }),
    ]);

  const viagemPorTransporteId = new Map(
    viagemRows.map((row) => [row.id, row]),
  );

  return {
    turno: turnoRows[0] ?? null,
    transportes: transportesRows.map((transporte) => {
      const viagem = viagemPorTransporteId.get(transporte.transporteId);

      return {
        ...transporte,
        etapaAtual:
          transporte.etapaAtual as TorreControleReadModel['transportes'][number]['etapaAtual'],
        viagemId: viagem?.viagemId ?? null,
        viagemInicioEm: viagem?.viagemInicioEm ?? null,
        viagemFimEm: viagem?.viagemFimEm ?? null,
        anomalia: viagem?.anomalia ?? null,
        pesoTotalKg: parsePesoKg(viagem?.pesoTotal),
        docaCodigo: viagem?.docaCodigo ?? null,
        lacreCarregamento: viagem?.lacreCarregamento ?? null,
      };
    }),
    pipeline: pipeline.map((row) => ({
      ...row,
      processo: row.processo as TorreControleReadModel['pipeline'][number]['processo'],
    })),
    mapasPendentes: mapasPendentes.map((mapa) => ({
      ...mapa,
      processo: mapa.processo as TorreControleReadModel['mapasPendentes'][number]['processo'],
    })),
    mapasOperacionais,
    mapasHorarios: mapasHorarios.map((mapa) => ({
      ...mapa,
      processo: mapa.processo as TorreControleReadModel['mapasHorarios'][number]['processo'],
    })),
    timeline,
    paletesPorTransporte,
  };
}
