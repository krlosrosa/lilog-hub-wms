import { eq, inArray } from 'drizzle-orm';

import { buildResumoConferidoPorProduto } from '../../../domain/services/recebimento-resumo-conferido.js';
import { toBaseUnits } from '../../../domain/services/unidade-medida.js';
import { resolveProdutoConferenciaConfig } from '../../../domain/services/recebimento-produto-rules.js';
import type {
  ConferenciaConferidoRecord,
  ConferenciaContextRecord,
} from '../../../domain/repositories/recebimento/conferencia.repository.js';
import { mapProdutoRow } from '../produto/map-produto.drizzle.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';

import { funcionarios } from '../providers/drizzle/config/schemas/auth.schema.js';
import {
  checklistRecebimento,
  docas,
  itensPreRecebimento,
  itensRecebimento,
  pesagensRecebimento,
  preRecebimentos,
  produtos,
  recebimentos,
  unidades,
} from '../providers/drizzle/config/migrations/schema.js';

import { mapItemRecebimentoRow, mapPesagemRecebimentoRow, mapPreRecebimentoRow } from './map-recebimento.drizzle.js';



export async function getConferenciaContextDb(
  db: DrizzleClient,
  preRecebimentoId: string,
): Promise<ConferenciaContextRecord | null> {

  const [preRow] = await db

    .select()

    .from(preRecebimentos)

    .where(eq(preRecebimentos.id, preRecebimentoId))

    .limit(1);



  if (!preRow) {

    return null;

  }



  const preRecebimento = mapPreRecebimentoRow(preRow);



  const [preDocaRow] = preRecebimento.docaId
    ? await db
        .select({ codigo: docas.codigo })
        .from(docas)
        .where(eq(docas.id, preRecebimento.docaId))
        .limit(1)
    : [];

  const [recebimentoRow] = await db

    .select({

      recebimento: recebimentos,

      docaCodigo: docas.codigo,

      conferenteNome: funcionarios.nome,
      conferenteMatricula: funcionarios.matricula,

    })

    .from(recebimentos)

    .leftJoin(docas, eq(recebimentos.docaId, docas.id))

    .leftJoin(funcionarios, eq(recebimentos.responsavelId, funcionarios.id))

    .where(eq(recebimentos.preRecebimentoId, preRecebimentoId))

    .limit(1);



  const itemRows = await db

    .select({

      item: itensPreRecebimento,

      produto: produtos,

    })

    .from(itensPreRecebimento)

    .innerJoin(produtos, eq(itensPreRecebimento.produtoId, produtos.produtoId))

    .where(eq(itensPreRecebimento.preRecebimentoId, preRecebimentoId));



  const conferidoRows = recebimentoRow
    ? await db
        .select({
          item: itensRecebimento,
          produto: produtos,
        })
        .from(itensRecebimento)
        .innerJoin(produtos, eq(itensRecebimento.produtoId, produtos.produtoId))
        .where(eq(itensRecebimento.recebimentoId, recebimentoRow.recebimento.id))
    : [];

  const itemIds = conferidoRows.map(({ item }) => item.id);
  const pesagemRows =
    itemIds.length > 0
      ? await db
          .select()
          .from(pesagensRecebimento)
          .where(inArray(pesagensRecebimento.recebimentoItemId, itemIds))
      : [];

  const pesagensByItemId = new Map<
    string,
    ReturnType<typeof mapPesagemRecebimentoRow>[]
  >();

  for (const row of pesagemRows) {
    const mapped = mapPesagemRecebimentoRow(row);
    const current = pesagensByItemId.get(mapped.recebimentoItemId) ?? [];
    current.push(mapped);
    pesagensByItemId.set(mapped.recebimentoItemId, current);
  }

  const [checklistRow] = recebimentoRow
    ? await db
        .select({ id: checklistRecebimento.id })
        .from(checklistRecebimento)
        .where(
          eq(checklistRecebimento.recebimentoId, recebimentoRow.recebimento.id),
        )
        .limit(1)
    : [];

  const [unidadeRow] = await db
    .select({ modoUnitizacaoRecebimento: unidades.modoUnitizacaoRecebimento })
    .from(unidades)
    .where(eq(unidades.id, preRecebimento.unidadeId))
    .limit(1);

  const modoUnitizacao =
    recebimentoRow?.recebimento.modoUnitizacao ??
    unidadeRow?.modoUnitizacaoRecebimento ??
    'gerar_etiqueta_na_armazenagem';

  const itens = itemRows.map(({ item, produto }) => {
    const produtoRecord = mapProdutoRow(produto);

    return {
      produtoId: item.produtoId,
      sku: produto.sku,
      descricao: produto.descricao,
      unidadeMedida: item.unidadeMedida,
      unidadesPorCaixa: produto.unidadesPorCaixa ?? 1,
      quantidadeEsperada: toBaseUnits(
        Number(item.quantidadeEsperada),
        item.unidadeMedida,
        produto.unidadesPorCaixa ?? 1,
      ),
      config: resolveProdutoConferenciaConfig(produtoRecord),
    };
  });

  const conferidos: ConferenciaConferidoRecord[] = [];

  for (const { item: row, produto } of conferidoRows) {
    const mapped = mapItemRecebimentoRow(row);
    const produtoRecord = mapProdutoRow(produto);
    const config = resolveProdutoConferenciaConfig(produtoRecord);
    const pesagens = pesagensByItemId.get(mapped.id) ?? [];

    const base = {
      produtoId: mapped.produtoId,
      sku: produto.sku,
      descricao: produto.descricao,
      unidadesPorCaixa: produto.unidadesPorCaixa ?? 1,
      config,
      unidadeMedida: mapped.unidadeMedida,
      loteRecebido: mapped.loteRecebido,
      validade: mapped.validade,
      unitizadorCodigo: null,
      unitizadorId: mapped.unitizadorId,
      recebimentoItemId: mapped.id,
    } as const;

    if (pesagens.length > 0) {
      for (const pesagem of pesagens) {
        conferidos.push({
          id: pesagem.id,
          ...base,
          quantidadeRecebida: 1,
          pesoRecebido: pesagem.pesoKg,
          etiquetaCodigo: pesagem.etiquetaCodigo,
          pesagemId: pesagem.id,
          clientConferenceId: pesagem.clientConferenceId ?? null,
        });
      }
    } else {
      conferidos.push({
        id: mapped.id,
        ...base,
        quantidadeRecebida: mapped.quantidadeRecebida,
        pesoRecebido: mapped.pesoRecebido,
        etiquetaCodigo: null,
        pesagemId: null,
        clientConferenceId: mapped.clientConferenceId ?? null,
      });
    }
  }

  const resumoConferido = buildResumoConferidoPorProduto({
    esperados: itemRows.map(({ item, produto }) => ({
      produtoId: item.produtoId,
      quantidadeEsperada: Number(item.quantidadeEsperada),
      unidadeMedida: item.unidadeMedida,
      unidadesPorCaixa: produto.unidadesPorCaixa ?? 1,
    })),
    conferidos: conferidos.map((item) => ({
      produtoId: item.produtoId,
      quantidadeRecebida: item.quantidadeRecebida,
      unidadeMedida: item.unidadeMedida,
      pesoRecebido: item.pesoRecebido,
    })),
  });

  return {
    preRecebimentoId: preRecebimento.id,
    recebimentoId: recebimentoRow?.recebimento.id ?? null,
    unidadeId: preRecebimento.unidadeId,
    placa: preRecebimento.placa,
    transportadoraNome: preRecebimento.transportadoraNome,
    situacao: preRecebimento.situacao,
    recebimentoSituacao: recebimentoRow?.recebimento.situacao ?? null,
    dock: recebimentoRow?.docaCodigo ?? preDocaRow?.codigo ?? null,
    checklistPreenchido: !!checklistRow,
    conferenteId: recebimentoRow?.recebimento.responsavelId ?? null,
    conferente: recebimentoRow?.conferenteNome ?? null,
    conferenteMatricula: recebimentoRow?.conferenteMatricula ?? null,
    modoUnitizacao,
    itens,
    conferidos,
    resumoConferido,
  };

}


