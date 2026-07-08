import { and, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';



import type { ListOperadorDemandasFilter } from '../../../domain/repositories/recebimento/conferencia.repository.js';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';

import {

  docas,

  preRecebimentos,

  recebimentos,

} from '../providers/drizzle/config/migrations/schema.js';

const preDocas = alias(docas, 'pre_docas');



const OPERADOR_SITUACOES = [
  'liberado_para_conferencia',
  'em_conferencia',
] as const;



export async function listOperadorDemandasDb(

  db: DrizzleClient,

  filter: ListOperadorDemandasFilter,

) {

  const conditions = [

    inArray(preRecebimentos.situacao, [...OPERADOR_SITUACOES]),

  ];



  if (filter.unidadeId) {

    conditions.push(eq(preRecebimentos.unidadeId, filter.unidadeId));

  }



  const rows = await db

    .select({

      preRecebimento: preRecebimentos,

      recebimento: recebimentos,

      docaCodigo: docas.codigo,
      preDocaCodigo: preDocas.codigo,

      skuCount: sql<number>`(

        SELECT count(*)::int

        FROM recebimento.itens_pre_recebimento

        WHERE pre_recebimento_id = ${preRecebimentos.id}

      )`,

    })

    .from(preRecebimentos)

    .leftJoin(

      recebimentos,

      eq(recebimentos.preRecebimentoId, preRecebimentos.id),

    )

    .leftJoin(docas, eq(recebimentos.docaId, docas.id))
    .leftJoin(preDocas, eq(preRecebimentos.docaId, preDocas.id))

    .where(and(...conditions))

    .orderBy(preRecebimentos.horarioPrevisto);



  return rows.map(({ preRecebimento, recebimento, docaCodigo, preDocaCodigo, skuCount }) => ({

    preRecebimentoId: preRecebimento.id,

    recebimentoId: recebimento?.id ?? null,

    unidadeId: preRecebimento.unidadeId,

    placa: preRecebimento.placa,

    transportadoraNome: preRecebimento.transportadoraNome,

    situacao: preRecebimento.situacao,

    dock: docaCodigo ?? preDocaCodigo ?? null,

    skuCount: skuCount ?? 0,

    horarioPrevisto: preRecebimento.horarioPrevisto,

  }));

}


