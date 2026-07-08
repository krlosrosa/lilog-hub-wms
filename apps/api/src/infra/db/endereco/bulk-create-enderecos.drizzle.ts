import type { CreateEnderecoData } from '../../../domain/model/endereco/endereco.model.js';

import type { EnderecoBulkCreateResult } from '../../../domain/repositories/endereco/endereco.repository.js';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';

import { enderecos } from '../providers/drizzle/config/migrations/schema.js';

import { toEnderecoInsertValues } from './map-endereco.drizzle.js';



function resolveInsertErrorMessage(error: unknown): string {

  if (!(error instanceof Error)) {

    return 'Erro ao inserir endereço';

  }



  if (error.message.includes('enderecos_unidade_id_unidades_id_fk')) {

    return 'Unidade ID não encontrada';

  }



  return error.message;

}



export async function bulkCreateEnderecosDb(

  db: DrizzleClient,

  items: CreateEnderecoData[],

): Promise<EnderecoBulkCreateResult> {

  let inserted = 0;

  const errors: EnderecoBulkCreateResult['errors'] = [];



  for (let index = 0; index < items.length; index++) {

    const data = items[index]!;



    try {

      const [record] = await db

        .insert(enderecos)

        .values(toEnderecoInsertValues(data))

        .onConflictDoNothing({

          target: [enderecos.unidadeId, enderecos.enderecoMascarado],

        })

        .returning({ id: enderecos.id });



      if (record) {

        inserted += 1;

        continue;

      }



      errors.push({

        index,

        message: `Endereço "${data.enderecoMascarado}" já existe nesta unidade`,

      });

    } catch (error) {

      errors.push({

        index,

        message: resolveInsertErrorMessage(error),

      });

    }

  }



  return { inserted, errors };

}


