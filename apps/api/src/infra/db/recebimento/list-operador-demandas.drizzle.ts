import { and, eq, inArray, sql } from 'drizzle-orm';



import type { ListOperadorDemandasFilter } from '../../../domain/repositories/recebimento/conferencia.repository.js';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';

import {

  docas,

  preRecebimentos,

  recebimentos,

} from '../providers/drizzle/config/migrations/schema.js';



const OPERADOR_SITUACOES = [
  'aguardando_aprovacao',
  'agendado',
  'veiculo_chegou',
  'em_recebimento',
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

    .where(and(...conditions))

    .orderBy(preRecebimentos.horarioPrevisto);



  return rows.map(({ preRecebimento, recebimento, docaCodigo, skuCount }) => ({

    preRecebimentoId: preRecebimento.id,

    recebimentoId: recebimento?.id ?? null,

    unidadeId: preRecebimento.unidadeId,

    placa: preRecebimento.placa,

    transportadoraId: preRecebimento.transportadoraId,

    situacao: preRecebimento.situacao,

    dock: docaCodigo ?? null,

    skuCount: skuCount ?? 0,

    horarioPrevisto: preRecebimento.horarioPrevisto,

  }));

}


