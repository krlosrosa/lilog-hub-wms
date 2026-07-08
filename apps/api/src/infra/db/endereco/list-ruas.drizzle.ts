import { and, eq } from 'drizzle-orm';



import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';

import { enderecos } from '../providers/drizzle/config/migrations/schema.js';



export async function listDistinctRuasDb(

  db: DrizzleClient,

  params: { unidadeId?: string; zona?: string } = {},

) {

  const conditions = [];



  if (params.unidadeId) {

    conditions.push(eq(enderecos.unidadeId, params.unidadeId));

  }



  if (params.zona?.trim()) {

    conditions.push(eq(enderecos.zona, params.zona.trim()));

  }



  const rows = await db

    .selectDistinct({ rua: enderecos.rua })

    .from(enderecos)

    .where(conditions.length > 0 ? and(...conditions) : undefined)

    .orderBy(enderecos.rua);



  return rows.map((row) => row.rua);

}


