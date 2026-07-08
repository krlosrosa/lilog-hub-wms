import { and, asc, eq, inArray } from 'drizzle-orm';

import type {
  BuscarDemandaDevolucaoFilter,
  BuscarDemandaDevolucaoResult,
  DevolucaoItemCondicao,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoChecklist,
  devolucaoEventos,
  devolucaoItens,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  isProdutoTipoPvar,
  joinProdutoDevolucaoItemPorCodigoProdutoId,
  joinProdutoDevolucaoItemPorProdutoId,
  joinProdutoDevolucaoItemPorSku,
  produtoPorCodigoProdutoId,
  produtoPorProdutoId,
  produtoPorSku,
  produtoTipoDevolucaoItem,
} from './produto-devolucao-item.drizzle.js';

export async function buscarDemandaDevolucaoDb(
  db: DrizzleClient,
  filter: BuscarDemandaDevolucaoFilter,
): Promise<BuscarDemandaDevolucaoResult | null> {
  const [demandaRow] = await db
    .select({
      id: demandasDevolucao.id,
      unidadeId: demandasDevolucao.unidadeId,
      codigoDemanda: demandasDevolucao.codigoDemanda,
      status: demandasDevolucao.status,
      observacao: demandasDevolucao.observacao,
      placa: demandasDevolucao.placa,
      doca: demandasDevolucao.doca,
      cargaSegregada: demandasDevolucao.cargaSegregada,
      paletesEsperados: demandasDevolucao.paletesEsperados,
      createdAt: demandasDevolucao.createdAt,
      updatedAt: demandasDevolucao.updatedAt,
      concluidaAt: demandasDevolucao.concluidaAt,
    })
    .from(demandasDevolucao)
    .where(
      and(
        eq(demandasDevolucao.id, filter.demandaId),
        eq(demandasDevolucao.unidadeId, filter.unidadeId),
      ),
    )
    .limit(1);

  if (!demandaRow) {
    return null;
  }

  const nfRows = await db
    .select({
      id: devolucaoNotasFiscais.id,
      numeroNf: devolucaoNotasFiscais.numeroNf,
      chaveAcesso: devolucaoNotasFiscais.chaveAcesso,
      tipo: devolucaoNotasFiscais.tipo,
      motivo: devolucaoNotasFiscais.motivo,
      cliente: devolucaoNotasFiscais.cliente,
      codCliente: devolucaoNotasFiscais.codCliente,
      transporteId: devolucaoNotasFiscais.transporteId,
      observacao: devolucaoNotasFiscais.observacao,
      createdAt: devolucaoNotasFiscais.createdAt,
    })
    .from(devolucaoNotasFiscais)
    .where(eq(devolucaoNotasFiscais.demandaId, demandaRow.id))
    .orderBy(asc(devolucaoNotasFiscais.numeroNf));

  const nfIds = nfRows.map((nf) => nf.id);
  const itensPorNfId = new Map<
    string,
    BuscarDemandaDevolucaoResult['notasFiscais'][number]['itens']
  >();

  if (nfIds.length > 0) {
    const itemRows = await db
      .select({
        id: devolucaoItens.id,
        devolucaoNfId: devolucaoItens.devolucaoNfId,
        produtoId: devolucaoItens.produtoId,
        sku: devolucaoItens.sku,
        descricaoProduto: devolucaoItens.descricaoProduto,
        lote: devolucaoItens.lote,
        dataFabricacao: devolucaoItens.dataFabricacao,
        quantidade: devolucaoItens.quantidade,
        qtdConferida: devolucaoItens.qtdConferida,
        unidadeMedida: devolucaoItens.unidadeMedida,
        quantidadeNormalizadaUnidades: devolucaoItens.quantidadeNormalizadaUnidades,
        pesoDevolvido: devolucaoItens.pesoDevolvido,
        motivoItem: devolucaoItens.motivoItem,
        condicao: devolucaoItens.condicao,
        observacao: devolucaoItens.observacao,
        createdAt: devolucaoItens.createdAt,
        produtoTipo: produtoTipoDevolucaoItem,
      })
      .from(devolucaoItens)
      .leftJoin(
        produtoPorProdutoId,
        joinProdutoDevolucaoItemPorProdutoId(devolucaoItens.produtoId),
      )
      .leftJoin(
        produtoPorSku,
        joinProdutoDevolucaoItemPorSku(devolucaoItens.sku),
      )
      .leftJoin(
        produtoPorCodigoProdutoId,
        joinProdutoDevolucaoItemPorCodigoProdutoId(devolucaoItens.sku),
      )
      .where(inArray(devolucaoItens.devolucaoNfId, nfIds))
      .orderBy(asc(devolucaoItens.sku));

    itemRows.forEach((item) => {
      const atual = itensPorNfId.get(item.devolucaoNfId) ?? [];
      atual.push({
        id: item.id,
        produtoId: item.produtoId,
        sku: item.sku,
        descricaoProduto: item.descricaoProduto,
        lote: item.lote,
        dataFabricacao: item.dataFabricacao,
        quantidade: Number(item.quantidade),
        qtdConferida:
          item.qtdConferida !== null && item.qtdConferida !== undefined
            ? Number(item.qtdConferida)
            : null,
        unidadeMedida: item.unidadeMedida,
        quantidadeNormalizadaUnidades: Number(item.quantidadeNormalizadaUnidades),
        pesoDevolvido:
          item.pesoDevolvido !== null ? Number(item.pesoDevolvido) : null,
        motivoItem: item.motivoItem,
        condicao: item.condicao as DevolucaoItemCondicao,
        observacao: item.observacao,
        createdAt: item.createdAt,
        pesoVariavel: isProdutoTipoPvar(item.produtoTipo),
      });
      itensPorNfId.set(item.devolucaoNfId, atual);
    });
  }

  const eventoRows = await db
    .select({
      id: devolucaoEventos.id,
      statusAnterior: devolucaoEventos.statusAnterior,
      statusNovo: devolucaoEventos.statusNovo,
      descricao: devolucaoEventos.descricao,
      criadoPorUserId: devolucaoEventos.criadoPorUserId,
      createdAt: devolucaoEventos.createdAt,
    })
    .from(devolucaoEventos)
    .where(eq(devolucaoEventos.demandaId, demandaRow.id))
    .orderBy(asc(devolucaoEventos.createdAt));

  const [checklistRow] = await db
    .select({
      id: devolucaoChecklist.id,
      dock: devolucaoChecklist.dock,
      paletesRecebidos: devolucaoChecklist.paletesRecebidos,
      tempBau: devolucaoChecklist.tempBau,
      tempProduto: devolucaoChecklist.tempProduto,
      conditions: devolucaoChecklist.conditions,
      observacoes: devolucaoChecklist.observacoes,
      photoCount: devolucaoChecklist.photoCount,
      createdAt: devolucaoChecklist.createdAt,
      updatedAt: devolucaoChecklist.updatedAt,
    })
    .from(devolucaoChecklist)
    .where(eq(devolucaoChecklist.demandaId, demandaRow.id))
    .limit(1);

  const notasFiscais = nfRows.map((nf) => ({
    id: nf.id,
    numeroNf: nf.numeroNf,
    chaveAcesso: nf.chaveAcesso,
    tipo: nf.tipo,
    motivo: nf.motivo,
    cliente: nf.cliente,
    codCliente: nf.codCliente,
    transporteId: nf.transporteId,
    observacao: nf.observacao,
    createdAt: nf.createdAt,
    itens: itensPorNfId.get(nf.id) ?? [],
  }));

  const totalItens = notasFiscais.reduce((acc, nf) => acc + nf.itens.length, 0);
  const pesoDevolvido = notasFiscais.reduce(
    (acc, nf) =>
      acc +
      nf.itens.reduce((itemAcc, item) => itemAcc + (item.pesoDevolvido ?? 0), 0),
    0,
  );
  const tiposNf = [...new Set(notasFiscais.map((nf) => nf.tipo))];
  const transporteId = notasFiscais[0]?.transporteId ?? null;
  const cliente = notasFiscais[0]?.cliente ?? null;

  return {
    id: demandaRow.id,
    unidadeId: demandaRow.unidadeId,
    codigoDemanda: demandaRow.codigoDemanda,
    status: demandaRow.status,
    observacao: demandaRow.observacao,
    placa: demandaRow.placa,
    doca: demandaRow.doca,
    cargaSegregada: demandaRow.cargaSegregada,
    paletesEsperados: demandaRow.paletesEsperados,
    createdAt: demandaRow.createdAt,
    updatedAt: demandaRow.updatedAt,
    concluidaAt: demandaRow.concluidaAt,
    totalNfs: notasFiscais.length,
    totalItens,
    pesoDevolvido,
    transporteId,
    cliente,
    tiposNf,
    notasFiscais,
    eventos: eventoRows.map((evento) => ({
      id: evento.id,
      statusAnterior: evento.statusAnterior,
      statusNovo: evento.statusNovo,
      descricao: evento.descricao,
      criadoPorUserId: evento.criadoPorUserId,
      createdAt: evento.createdAt,
    })),
    checklist: checklistRow
      ? {
          id: checklistRow.id,
          dock: checklistRow.dock,
          paletesRecebidos: checklistRow.paletesRecebidos,
          tempBau:
            checklistRow.tempBau !== null ? Number(checklistRow.tempBau) : null,
          tempProduto:
            checklistRow.tempProduto !== null
              ? Number(checklistRow.tempProduto)
              : null,
          conditions: checklistRow.conditions ?? {},
          observacoes: checklistRow.observacoes,
          photoCount: checklistRow.photoCount,
          createdAt: checklistRow.createdAt,
          updatedAt: checklistRow.updatedAt,
        }
      : null,
  };
}
