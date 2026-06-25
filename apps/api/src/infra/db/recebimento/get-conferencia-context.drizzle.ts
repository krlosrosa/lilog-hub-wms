import { eq } from 'drizzle-orm';



import { resolveProdutoConferenciaConfig } from '../../../domain/services/recebimento-produto-rules.js';
import { mapProdutoRow } from '../produto/map-produto.drizzle.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';

import {
  checklistRecebimento,
  docas,
  itensPreRecebimento,
  itensRecebimento,
  preRecebimentos,
  produtos,
  recebimentos,
} from '../providers/drizzle/config/migrations/schema.js';

import { mapItemRecebimentoRow, mapPreRecebimentoRow } from './map-recebimento.drizzle.js';



export async function getConferenciaContextDb(

  db: DrizzleClient,

  preRecebimentoId: string,

) {

  const [preRow] = await db

    .select()

    .from(preRecebimentos)

    .where(eq(preRecebimentos.id, preRecebimentoId))

    .limit(1);



  if (!preRow) {

    return null;

  }



  const preRecebimento = mapPreRecebimentoRow(preRow);



  const [recebimentoRow] = await db

    .select({

      recebimento: recebimentos,

      docaCodigo: docas.codigo,

    })

    .from(recebimentos)

    .leftJoin(docas, eq(recebimentos.docaId, docas.id))

    .where(eq(recebimentos.preRecebimentoId, preRecebimentoId))

    .limit(1);



  const itemRows = await db

    .select({

      item: itensPreRecebimento,

      produto: produtos,

    })

    .from(itensPreRecebimento)

    .innerJoin(produtos, eq(itensPreRecebimento.produtoId, produtos.id))

    .where(eq(itensPreRecebimento.preRecebimentoId, preRecebimentoId));



  const conferidoRows = recebimentoRow
    ? await db
        .select()
        .from(itensRecebimento)
        .where(eq(itensRecebimento.recebimentoId, recebimentoRow.recebimento.id))
    : [];

  const [checklistRow] = recebimentoRow
    ? await db
        .select({ id: checklistRecebimento.id })
        .from(checklistRecebimento)
        .where(
          eq(checklistRecebimento.recebimentoId, recebimentoRow.recebimento.id),
        )
        .limit(1)
    : [];

  return {
    preRecebimentoId: preRecebimento.id,
    recebimentoId: recebimentoRow?.recebimento.id ?? null,
    unidadeId: preRecebimento.unidadeId,
    placa: preRecebimento.placa,
    transportadoraId: preRecebimento.transportadoraId,
    situacao: preRecebimento.situacao,
    recebimentoSituacao: recebimentoRow?.recebimento.situacao ?? null,
    dock: recebimentoRow?.docaCodigo ?? null,
    checklistPreenchido: !!checklistRow,

    itens: itemRows.map(({ item, produto }) => {
      const produtoRecord = mapProdutoRow(produto);

      return {

        produtoId: item.produtoId,

        sku: produto.sku,

        descricao: produto.descricao,

        unidadeMedida: item.unidadeMedida,

        unidadesPorCaixa: produto.unidadesPorCaixa ?? 1,

        config: resolveProdutoConferenciaConfig(produtoRecord),

      };

    }),

    conferidos: conferidoRows.map((row) => {

      const mapped = mapItemRecebimentoRow(row);



      return {

        id: mapped.id,

        produtoId: mapped.produtoId,

        quantidadeRecebida: mapped.quantidadeRecebida,

        unidadeMedida: mapped.unidadeMedida,

      };

    }),

  };

}


