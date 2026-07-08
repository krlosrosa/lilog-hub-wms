import { and, eq } from 'drizzle-orm';



import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';

import { enderecos } from '../providers/drizzle/config/migrations/schema.js';



export type EnsureEnderecoVirtualDepositoInput = {

  unidadeId: string;

  depositoCodigo: string;

};



export type EnderecoVirtualDepositoRecord = {

  id: string;

  enderecoMascarado: string;

};



function buildEnderecoMascaradoVirtual(depositoCodigo: string): string {

  return `DEP-${depositoCodigo}`;

}



export async function ensureEnderecoVirtualDepositoDb(

  db: DrizzleClient,

  input: EnsureEnderecoVirtualDepositoInput,

): Promise<EnderecoVirtualDepositoRecord> {

  const enderecoMascarado = buildEnderecoMascaradoVirtual(input.depositoCodigo);



  const existing = await db

    .select({

      id: enderecos.id,

      enderecoMascarado: enderecos.enderecoMascarado,

    })

    .from(enderecos)

    .where(

      and(

        eq(enderecos.unidadeId, input.unidadeId),

        eq(enderecos.enderecoMascarado, enderecoMascarado),

      ),

    )

    .limit(1);



  if (existing[0]) {

    return existing[0];

  }



  const [created] = await db

    .insert(enderecos)

    .values({

      enderecoMascarado,

      unidadeId: input.unidadeId,

      zona: 'VIRTUAL',

      rua: '0000',

      posicao: '000',

      nivel: '00',

      tipo: 'area_operacional',

      status: 'disponivel',

      tipoEstrutura: 'area-delimitada',

      larguraMm: 0,

      alturaMm: 0,

      profundidadeMm: 0,

      cargaMaxKg: '0',

      capacidadeVolume: '0',

      observacao: `Endereço virtual do depósito ${input.depositoCodigo}`,

    })

    .returning({

      id: enderecos.id,

      enderecoMascarado: enderecos.enderecoMascarado,

    });



  if (!created) {

    throw new Error(

      `Falha ao criar endereço virtual para depósito "${input.depositoCodigo}"`,

    );

  }



  return created;

}


