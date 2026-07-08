import { and, eq, or, sql } from 'drizzle-orm';

import { applyOcupacaoFromSaldoToEndereco } from '../../../domain/services/resolve-endereco-ocupacao-from-saldo.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandaEnderecos,
  enderecos,
  movimentacoesEstoque,
  saldosEndereco,
  unidades,
} from '../providers/drizzle/config/migrations/schema.js';
import { mapEnderecoRow } from './map-endereco.drizzle.js';
import { getTotalSaldoQuantidadeByEnderecoIdDb } from './saldo-por-endereco.drizzle.js';



export async function findEnderecoByIdDb(db: DrizzleClient, id: string) {

  const rows = await db

    .select({

      endereco: enderecos,

      unidade: unidades,

    })

    .from(enderecos)

    .innerJoin(unidades, eq(enderecos.unidadeId, unidades.id))

    .where(eq(enderecos.id, id))

    .limit(1);



  const row = rows[0];



  if (!row) {

    return null;

  }



  const totalSaldoQuantidade = await getTotalSaldoQuantidadeByEnderecoIdDb(
    db,
    row.endereco.id,
  );

  return applyOcupacaoFromSaldoToEndereco(
    mapEnderecoRow(row.endereco, row.unidade),
    totalSaldoQuantidade,
  );

}



export async function findEnderecoByUnidadeAndCodigoDb(

  db: DrizzleClient,

  unidadeId: string,

  enderecoMascarado: string,

) {

  const rows = await db

    .select({

      endereco: enderecos,

      unidade: unidades,

    })

    .from(enderecos)

    .innerJoin(unidades, eq(enderecos.unidadeId, unidades.id))

    .where(

      and(

        eq(enderecos.unidadeId, unidadeId),

        eq(enderecos.enderecoMascarado, enderecoMascarado.trim().toUpperCase()),

      ),

    )

    .limit(1);



  const row = rows[0];



  if (!row) {

    return null;

  }



  const totalSaldoQuantidade = await getTotalSaldoQuantidadeByEnderecoIdDb(
    db,
    row.endereco.id,
  );

  return applyOcupacaoFromSaldoToEndereco(
    mapEnderecoRow(row.endereco, row.unidade),
    totalSaldoQuantidade,
  );

}



export async function hasEnderecoStockDb(db: DrizzleClient, id: string) {

  const [row] = await db

    .select({

      total: sql<string>`coalesce(sum(${saldosEndereco.quantidade}), 0)`.as(

        'total',

      ),

    })

    .from(saldosEndereco)

    .where(eq(saldosEndereco.enderecoId, id));



  return Number(row?.total ?? 0) > 0;

}



export async function hasEnderecoMovementHistoryDb(

  db: DrizzleClient,

  id: string,

) {

  const [movement] = await db

    .select({ id: movimentacoesEstoque.id })

    .from(movimentacoesEstoque)

    .where(

      or(

        eq(movimentacoesEstoque.enderecoOrigemId, id),

        eq(movimentacoesEstoque.enderecoDestinoId, id),

      ),

    )

    .limit(1);



  if (movement) {

    return true;

  }



  const [demanda] = await db

    .select({ id: demandaEnderecos.id })

    .from(demandaEnderecos)

    .where(eq(demandaEnderecos.enderecoId, id))

    .limit(1);



  return Boolean(demanda);

}


