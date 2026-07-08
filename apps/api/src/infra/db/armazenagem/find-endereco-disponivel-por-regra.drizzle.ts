import {

  and,

  asc,

  eq,

  ilike,

  inArray,

  notInArray,

  sql,

  type SQL,

} from 'drizzle-orm';



import { TIPOS_ENDERECO_SUGESTAO_AUTOMATICA_ARMAZENAGEM } from '../../../domain/model/armazenagem/armazenagem.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';

import { enderecos } from '../providers/drizzle/config/migrations/schema.js';



export type FindEnderecoDisponivelPorRegraInput = {

  unidadeId: string;

  tipo: 'zona' | 'endereco';

  zona?: string | null;

  rua?: string | null;

  enderecoId?: string | null;

  excludeIds?: string[];

};



export async function findEnderecoDisponivelPorRegraDb(

  db: DrizzleClient,

  input: FindEnderecoDisponivelPorRegraInput,

): Promise<string | null> {

  const excludeIds = input.excludeIds ?? [];



  if (input.tipo === 'endereco') {

    if (!input.enderecoId) {

      return null;

    }



    if (excludeIds.includes(input.enderecoId)) {

      return null;

    }



    const conditions: SQL[] = [

      eq(enderecos.id, input.enderecoId),

      eq(enderecos.status, 'disponivel'),

      inArray(enderecos.tipo, [...TIPOS_ENDERECO_SUGESTAO_AUTOMATICA_ARMAZENAGEM]),

      eq(enderecos.unidadeId, input.unidadeId),

    ];



    const [row] = await db

      .select({ id: enderecos.id })

      .from(enderecos)

      .where(and(...conditions))

      .limit(1);



    return row?.id ?? null;

  }



  if (!input.zona?.trim() && !input.rua?.trim()) {

    return null;

  }



  const conditions: SQL[] = [

    eq(enderecos.status, 'disponivel'),

    inArray(enderecos.tipo, [...TIPOS_ENDERECO_SUGESTAO_AUTOMATICA_ARMAZENAGEM]),

    eq(enderecos.unidadeId, input.unidadeId),

  ];



  if (input.zona?.trim()) {

    conditions.push(ilike(enderecos.zona, input.zona.trim()));

  }



  if (input.rua?.trim()) {

    conditions.push(ilike(enderecos.rua, input.rua.trim()));

  }



  if (excludeIds.length > 0) {

    conditions.push(notInArray(enderecos.id, excludeIds));

  }



  const [row] = await db

    .select({ id: enderecos.id })

    .from(enderecos)

    .where(and(...conditions))

    .orderBy(

      sql`${enderecos.prioridadePicking} asc nulls last`,

      asc(enderecos.ocupacaoPercent),

      asc(enderecos.enderecoMascarado),

    )

    .limit(1);



  return row?.id ?? null;

}


