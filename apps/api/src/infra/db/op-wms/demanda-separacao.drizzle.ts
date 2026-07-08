import { and, eq, inArray, isNull, notExists, sql } from 'drizzle-orm';



import type { DemandaSeparacaoDetalheRecord } from '../../../domain/repositories/op-wms/demanda-separacao.repository.js';

import type {
  DrizzleClient,
  DrizzleExecutor,
} from '../providers/drizzle/drizzle.provider.js';

import {

  demandasSeparacao,

  mapaGrupos,

  mapaLotes,

  sessaoFuncionarios,

  transportes,

} from '../providers/drizzle/config/migrations/schema.js';



export function mapDemandaDetalhe(row: {

  id: string;

  unidadeId: string;

  sessaoId: string;

  mapaGrupoId: string;

  sessaoFuncionarioId: string;

  funcionarioId: number;

  status: DemandaSeparacaoDetalheRecord['status'];

  atribuidoPor: number | null;

  atribuidoEm: Date;

  iniciadoEm: Date | null;

  finalizadoEm: Date | null;

  createdAt: Date;

  updatedAt: Date;

  mapaGrupoTitulo: string;

  mapaGrupoMicroUuid: string;

  mapaGrupoProcesso: DemandaSeparacaoDetalheRecord['mapaGrupoProcesso'];

  transporteId: string;

  transporteRota: string | null;

  transporteDocaId: string | null;

  transporteLacreCarregamento: string | null;

  tempoEsperado: number;

}): DemandaSeparacaoDetalheRecord {

  return {

    id: row.id,

    unidadeId: row.unidadeId,

    sessaoId: row.sessaoId,

    mapaGrupoId: row.mapaGrupoId,

    sessaoFuncionarioId: row.sessaoFuncionarioId,

    funcionarioId: row.funcionarioId,

    status: row.status,

    atribuidoPor: row.atribuidoPor,

    atribuidoEm: row.atribuidoEm,

    iniciadoEm: row.iniciadoEm,

    finalizadoEm: row.finalizadoEm,

    createdAt: row.createdAt,

    updatedAt: row.updatedAt,

    mapaGrupoTitulo: row.mapaGrupoTitulo,

    mapaGrupoMicroUuid: row.mapaGrupoMicroUuid,

    mapaGrupoProcesso: row.mapaGrupoProcesso,

    transporteId: row.transporteId,

    transporteRota: row.transporteRota,

    transporteDocaId: row.transporteDocaId,

    transporteLacreCarregamento: row.transporteLacreCarregamento,

    tempoEsperadoMinutos: row.tempoEsperado,

  };

}



export async function findDemandaDetalheByIdDb(
  db: DrizzleExecutor,
  demandaId: string,
): Promise<DemandaSeparacaoDetalheRecord | null> {
  const rows = await db
    .select({
      id: demandasSeparacao.id,
      unidadeId: demandasSeparacao.unidadeId,
      sessaoId: demandasSeparacao.sessaoId,
      mapaGrupoId: demandasSeparacao.mapaGrupoId,
      sessaoFuncionarioId: demandasSeparacao.sessaoFuncionarioId,
      funcionarioId: sessaoFuncionarios.funcionarioId,
      status: demandasSeparacao.status,
      atribuidoPor: demandasSeparacao.atribuidoPor,
      atribuidoEm: demandasSeparacao.atribuidoEm,
      iniciadoEm: demandasSeparacao.iniciadoEm,
      finalizadoEm: demandasSeparacao.finalizadoEm,
      createdAt: demandasSeparacao.createdAt,
      updatedAt: demandasSeparacao.updatedAt,
      mapaGrupoTitulo: mapaGrupos.titulo,
      mapaGrupoMicroUuid: mapaGrupos.microUuid,
      mapaGrupoProcesso: mapaGrupos.processo,
      transporteId: mapaGrupos.transporteId,
      transporteRota: transportes.numeroTransporte,
      transporteDocaId: transportes.docaId,
      transporteLacreCarregamento: transportes.lacreCarregamento,
      tempoEsperado: mapaGrupos.tempoEsperado,
    })
    .from(demandasSeparacao)
    .innerJoin(mapaGrupos, eq(demandasSeparacao.mapaGrupoId, mapaGrupos.id))
    .innerJoin(transportes, eq(mapaGrupos.transporteId, transportes.numeroTransporte))
    .innerJoin(
      sessaoFuncionarios,
      eq(demandasSeparacao.sessaoFuncionarioId, sessaoFuncionarios.id),
    )
    .where(eq(demandasSeparacao.id, demandaId))
    .limit(1);

  const row = rows[0];
  return row ? mapDemandaDetalhe(row) : null;
}



export async function listDemandasSeparacaoBySessaoDb(

  db: DrizzleClient,

  sessaoId: string,

): Promise<DemandaSeparacaoDetalheRecord[]> {

  const rows = await db

    .select({

      id: demandasSeparacao.id,

      unidadeId: demandasSeparacao.unidadeId,

      sessaoId: demandasSeparacao.sessaoId,

      mapaGrupoId: demandasSeparacao.mapaGrupoId,

      sessaoFuncionarioId: demandasSeparacao.sessaoFuncionarioId,

      funcionarioId: sessaoFuncionarios.funcionarioId,

      status: demandasSeparacao.status,

      atribuidoPor: demandasSeparacao.atribuidoPor,

      atribuidoEm: demandasSeparacao.atribuidoEm,

      iniciadoEm: demandasSeparacao.iniciadoEm,

      finalizadoEm: demandasSeparacao.finalizadoEm,

      createdAt: demandasSeparacao.createdAt,

      updatedAt: demandasSeparacao.updatedAt,

      mapaGrupoTitulo: mapaGrupos.titulo,

      mapaGrupoMicroUuid: mapaGrupos.microUuid,

      mapaGrupoProcesso: mapaGrupos.processo,

      transporteId: mapaGrupos.transporteId,

      transporteRota: transportes.numeroTransporte,

      transporteDocaId: transportes.docaId,

      transporteLacreCarregamento: transportes.lacreCarregamento,

      tempoEsperado: mapaGrupos.tempoEsperado,

    })

    .from(demandasSeparacao)

    .innerJoin(mapaGrupos, eq(demandasSeparacao.mapaGrupoId, mapaGrupos.id))

    .innerJoin(transportes, eq(mapaGrupos.transporteId, transportes.numeroTransporte))

    .innerJoin(

      sessaoFuncionarios,

      eq(demandasSeparacao.sessaoFuncionarioId, sessaoFuncionarios.id),

    )

    .where(eq(demandasSeparacao.sessaoId, sessaoId))

    .orderBy(demandasSeparacao.atribuidoEm);



  return rows.map(mapDemandaDetalhe);

}



export async function listMapasGrupoDisponiveisDb(

  db: DrizzleClient,

  unidadeId: string,

  processo?: 'separacao' | 'conferencia' | 'carregamento',

) {

  const demandasAtivasSubquery = db

    .select({ id: demandasSeparacao.id })

    .from(demandasSeparacao)

    .where(

      and(

        eq(demandasSeparacao.mapaGrupoId, mapaGrupos.id),

        inArray(demandasSeparacao.status, ['pendente', 'em_andamento']),

      ),

    );



  const rows = await db

    .select({

      id: mapaGrupos.id,

      mapaLoteId: mapaGrupos.mapaLoteId,

      microUuid: mapaGrupos.microUuid,

      processo: mapaGrupos.processo,

      titulo: mapaGrupos.titulo,

      subtitulo: mapaGrupos.subtitulo,

      transporteId: mapaGrupos.transporteId,

      transporteRota: transportes.numeroTransporte,

      empresa: sql<string>`coalesce(${mapaGrupos.cabecalho}->>'empresa', '')`,

      categoria: sql<string>`coalesce(${mapaGrupos.cabecalho}->>'categoria', '')`,

      totalItens: mapaGrupos.totalItens,

      totalCaixas: sql<number>`coalesce((${mapaGrupos.cabecalho}->>'totalCaixas')::int, 0)`,

      totalUnidades: sql<number>`coalesce((${mapaGrupos.cabecalho}->>'totalUnidades')::int, 0)`,

      pesoTotal: mapaGrupos.pesoTotal,

      tempoEsperado: mapaGrupos.tempoEsperado,

      createdAt: mapaGrupos.createdAt,

    })

    .from(mapaGrupos)

    .innerJoin(mapaLotes, eq(mapaGrupos.mapaLoteId, mapaLotes.id))

    .innerJoin(transportes, eq(mapaGrupos.transporteId, transportes.numeroTransporte))

    .where(

      and(

        eq(mapaLotes.unidadeId, unidadeId),

        ...(processo ? [eq(mapaGrupos.processo, processo)] : []),

        isNull(mapaGrupos.finalizadoEm),

        isNull(mapaGrupos.iniciadoEm),

        notExists(demandasAtivasSubquery),

      ),

    )

    .orderBy(mapaGrupos.createdAt);



  return rows.map((row) => ({

    id: row.id,

    mapaLoteId: row.mapaLoteId,

    microUuid: row.microUuid,

    processo: row.processo,

    titulo: row.titulo,

    subtitulo: row.subtitulo,

    transporteId: row.transporteId,

    transporteRota: row.transporteRota,

    empresa: row.empresa,

    categoria: row.categoria,

    totalItens: row.totalItens,

    totalCaixas: Number(row.totalCaixas),

    totalUnidades: Number(row.totalUnidades),

    pesoTotalKg: Number(row.pesoTotal),

    tempoEsperadoMinutos: row.tempoEsperado,

    createdAt: row.createdAt,

  }));

}



export async function findMapaGruposByIdsDb(

  db: DrizzleClient,

  mapaGrupoIds: string[],

  unidadeId: string,

) {

  if (mapaGrupoIds.length === 0) return [];



  return db

    .select({

      id: mapaGrupos.id,

      titulo: mapaGrupos.titulo,

      microUuid: mapaGrupos.microUuid,

      transporteId: mapaGrupos.transporteId,

      processo: mapaGrupos.processo,

      finalizadoEm: mapaGrupos.finalizadoEm,

      iniciadoEm: mapaGrupos.iniciadoEm,

    })

    .from(mapaGrupos)

    .innerJoin(mapaLotes, eq(mapaGrupos.mapaLoteId, mapaLotes.id))

    .where(

      and(

        inArray(mapaGrupos.id, mapaGrupoIds),

        eq(mapaLotes.unidadeId, unidadeId),

      ),

    );

}



export async function findDemandasAtivasByMapaGrupoIdsDb(

  db: DrizzleClient,

  mapaGrupoIds: string[],

) {

  if (mapaGrupoIds.length === 0) return [];



  return db

    .select()

    .from(demandasSeparacao)

    .where(

      and(

        inArray(demandasSeparacao.mapaGrupoId, mapaGrupoIds),

        inArray(demandasSeparacao.status, ['pendente', 'em_andamento']),

      ),

    );

}



export async function insertDemandasSeparacaoDb(

  db: DrizzleClient,

  rows: Array<{

    unidadeId: string;

    sessaoId: string;

    mapaGrupoId: string;

    sessaoFuncionarioId: string;

    atribuidoPor: number;

  }>,

) {

  if (rows.length === 0) return [];



  const now = new Date();

  const sessaoFuncionarioId = rows[0]!.sessaoFuncionarioId;



  return db.transaction(async (tx) => {

    const inserted = await tx

      .insert(demandasSeparacao)

      .values(

        rows.map((row) => ({

          unidadeId: row.unidadeId,

          sessaoId: row.sessaoId,

          mapaGrupoId: row.mapaGrupoId,

          sessaoFuncionarioId: row.sessaoFuncionarioId,

          atribuidoPor: row.atribuidoPor,

          status: 'em_andamento' as const,

          iniciadoEm: now,

        })),

      )

      .returning({ id: demandasSeparacao.id });



    const ids = inserted.map((row) => row.id);

    if (ids.length === 0) return [];



    const mapaGrupoIds = rows.map((row) => row.mapaGrupoId);

    const mapasAtualizados = await tx

      .update(mapaGrupos)

      .set({

        iniciadoEm: now,

        sessaoFuncionarioId,

      })

      .where(

        and(

          inArray(mapaGrupos.id, mapaGrupoIds),

          isNull(mapaGrupos.iniciadoEm),

        ),

      )

      .returning({ id: mapaGrupos.id });



    if (mapasAtualizados.length !== rows.length) {

      throw new Error(

        'Um ou mais mapas-grupo já foram iniciados por outro processo',

      );

    }



    const detalhes = await tx

      .select({

        id: demandasSeparacao.id,

        unidadeId: demandasSeparacao.unidadeId,

        sessaoId: demandasSeparacao.sessaoId,

        mapaGrupoId: demandasSeparacao.mapaGrupoId,

        sessaoFuncionarioId: demandasSeparacao.sessaoFuncionarioId,

        funcionarioId: sessaoFuncionarios.funcionarioId,

        status: demandasSeparacao.status,

        atribuidoPor: demandasSeparacao.atribuidoPor,

        atribuidoEm: demandasSeparacao.atribuidoEm,

        iniciadoEm: demandasSeparacao.iniciadoEm,

        finalizadoEm: demandasSeparacao.finalizadoEm,

        createdAt: demandasSeparacao.createdAt,

        updatedAt: demandasSeparacao.updatedAt,

        mapaGrupoTitulo: mapaGrupos.titulo,

        mapaGrupoMicroUuid: mapaGrupos.microUuid,

        mapaGrupoProcesso: mapaGrupos.processo,

        transporteId: mapaGrupos.transporteId,

        transporteRota: transportes.numeroTransporte,

        transporteDocaId: transportes.docaId,

        transporteLacreCarregamento: transportes.lacreCarregamento,

        tempoEsperado: mapaGrupos.tempoEsperado,

      })

      .from(demandasSeparacao)

      .innerJoin(mapaGrupos, eq(demandasSeparacao.mapaGrupoId, mapaGrupos.id))

      .innerJoin(transportes, eq(mapaGrupos.transporteId, transportes.numeroTransporte))

      .innerJoin(

        sessaoFuncionarios,

        eq(demandasSeparacao.sessaoFuncionarioId, sessaoFuncionarios.id),

      )

      .where(inArray(demandasSeparacao.id, ids));



    return detalhes.map(mapDemandaDetalhe);

  });

}


