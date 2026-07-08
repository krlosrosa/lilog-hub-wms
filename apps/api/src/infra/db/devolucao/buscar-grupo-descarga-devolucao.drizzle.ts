import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import type {
  BuscarGrupoDescargaFilter,
  BuscarGrupoDescargaResult,
  DevolucaoGrupoDescargaStatus,
  DevolucaoItemCondicao,
  DevolucaoItemNaoContabilStatus,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoGrupoDemandas,
  devolucaoGruposDescarga,
  devolucaoItens,
  devolucaoItensNaoContabeis,
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

export async function buscarGrupoDescargaDevolucaoDb(
  db: DrizzleClient,
  filter: BuscarGrupoDescargaFilter,
): Promise<BuscarGrupoDescargaResult | null> {
  const [grupoRow] = await db
    .select({
      id: devolucaoGruposDescarga.id,
      unidadeId: devolucaoGruposDescarga.unidadeId,
      codigoGrupo: devolucaoGruposDescarga.codigoGrupo,
      placaDescarga: devolucaoGruposDescarga.placaDescarga,
      doca: devolucaoGruposDescarga.doca,
      cargaSegregada: devolucaoGruposDescarga.cargaSegregada,
      paletesEsperados: devolucaoGruposDescarga.paletesEsperados,
      observacao: devolucaoGruposDescarga.observacao,
      status: devolucaoGruposDescarga.status,
      createdAt: devolucaoGruposDescarga.createdAt,
      updatedAt: devolucaoGruposDescarga.updatedAt,
      startedAt: devolucaoGruposDescarga.startedAt,
      finishedAt: devolucaoGruposDescarga.finishedAt,
    })
    .from(devolucaoGruposDescarga)
    .where(
      and(
        eq(devolucaoGruposDescarga.id, filter.grupoId),
        eq(devolucaoGruposDescarga.unidadeId, filter.unidadeId),
      ),
    )
    .limit(1);

  if (!grupoRow) {
    return null;
  }

  const demandaLinks = await db
    .select({ demandaId: devolucaoGrupoDemandas.demandaId })
    .from(devolucaoGrupoDemandas)
    .where(eq(devolucaoGrupoDemandas.grupoId, grupoRow.id));

  const demandaIds = demandaLinks.map((link) => link.demandaId);

  if (demandaIds.length === 0) {
    return {
      ...grupoRow,
      status: grupoRow.status as DevolucaoGrupoDescargaStatus,
      demandas: [],
      itensEsperados: [],
      itensNaoContabeis: [],
    };
  }

  const demandaRows = await db
    .select({
      id: demandasDevolucao.id,
      codigoDemanda: demandasDevolucao.codigoDemanda,
      placa: demandasDevolucao.placa,
      status: demandasDevolucao.status,
    })
    .from(demandasDevolucao)
    .where(inArray(demandasDevolucao.id, demandaIds));

  const nfRows = await db
    .select({
      id: devolucaoNotasFiscais.id,
      demandaId: devolucaoNotasFiscais.demandaId,
      numeroNf: devolucaoNotasFiscais.numeroNf,
    })
    .from(devolucaoNotasFiscais)
    .where(inArray(devolucaoNotasFiscais.demandaId, demandaIds));

  const nfIds = nfRows.map((nf) => nf.id);
  const nfsPorDemanda = new Map<string, typeof nfRows>();
  nfRows.forEach((nf) => {
    const atual = nfsPorDemanda.get(nf.demandaId) ?? [];
    atual.push(nf);
    nfsPorDemanda.set(nf.demandaId, atual);
  });

  const itensPorNf = new Map<string, number>();
  const pesoPorDemanda = new Map<string, number>();
  const itensEsperados: BuscarGrupoDescargaResult['itensEsperados'] = [];

  if (nfIds.length > 0) {
    const itemRows = await db
      .select({
        id: devolucaoItens.id,
        devolucaoNfId: devolucaoItens.devolucaoNfId,
        sku: devolucaoItens.sku,
        descricaoProduto: devolucaoItens.descricaoProduto,
        quantidade: devolucaoItens.quantidade,
        qtdConferida: devolucaoItens.qtdConferida,
        unidadeMedida: devolucaoItens.unidadeMedida,
        condicao: devolucaoItens.condicao,
        pesoDevolvido: devolucaoItens.pesoDevolvido,
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
      .where(inArray(devolucaoItens.devolucaoNfId, nfIds));

    const nfMeta = new Map(nfRows.map((nf) => [nf.id, nf]));
    const demandaMeta = new Map(demandaRows.map((d) => [d.id, d]));

    itemRows.forEach((item) => {
      itensPorNf.set(
        item.devolucaoNfId,
        (itensPorNf.get(item.devolucaoNfId) ?? 0) + 1,
      );

      const nf = nfMeta.get(item.devolucaoNfId);
      if (!nf) return;

      const demanda = demandaMeta.get(nf.demandaId);
      if (!demanda) return;

      if (item.pesoDevolvido !== null) {
        pesoPorDemanda.set(
          nf.demandaId,
          (pesoPorDemanda.get(nf.demandaId) ?? 0) + Number(item.pesoDevolvido),
        );
      }

      itensEsperados.push({
        itemId: item.id,
        demandaId: nf.demandaId,
        codigoDemanda: demanda.codigoDemanda,
        notaFiscalId: nf.id,
        numeroNf: nf.numeroNf,
        sku: item.sku,
        descricaoProduto: item.descricaoProduto,
        quantidade: Number(item.quantidade),
        qtdConferida:
          item.qtdConferida !== null ? Number(item.qtdConferida) : null,
        unidadeMedida: item.unidadeMedida,
        condicao: item.condicao as DevolucaoItemCondicao,
        pesoVariavel: isProdutoTipoPvar(item.produtoTipo),
      });
    });
  }

  const itensNaoContabeisRows = await db
    .select({
      id: devolucaoItensNaoContabeis.id,
      sku: devolucaoItensNaoContabeis.sku,
      descricaoProduto: devolucaoItensNaoContabeis.descricaoProduto,
      quantidadeConferida: devolucaoItensNaoContabeis.quantidadeConferida,
      unidadeMedida: devolucaoItensNaoContabeis.unidadeMedida,
      lote: devolucaoItensNaoContabeis.lote,
      dataFabricacao: devolucaoItensNaoContabeis.dataFabricacao,
      condicao: devolucaoItensNaoContabeis.condicao,
      observacao: devolucaoItensNaoContabeis.observacao,
      status: devolucaoItensNaoContabeis.status,
      demandaId: devolucaoItensNaoContabeis.demandaId,
      createdAt: devolucaoItensNaoContabeis.createdAt,
    })
    .from(devolucaoItensNaoContabeis)
    .where(eq(devolucaoItensNaoContabeis.grupoDescargaId, grupoRow.id));

  const demandas = demandaRows.map((demanda) => {
    const nfs = nfsPorDemanda.get(demanda.id) ?? [];
    const totalItens = nfs.reduce(
      (acc, nf) => acc + (itensPorNf.get(nf.id) ?? 0),
      0,
    );

    return {
      id: demanda.id,
      codigoDemanda: demanda.codigoDemanda,
      placa: demanda.placa,
      status: demanda.status,
      totalNfs: nfs.length,
      totalItens,
      pesoDevolvido: pesoPorDemanda.get(demanda.id) ?? 0,
    };
  });

  return {
    id: grupoRow.id,
    unidadeId: grupoRow.unidadeId,
    codigoGrupo: grupoRow.codigoGrupo,
    placaDescarga: grupoRow.placaDescarga,
    doca: grupoRow.doca,
    cargaSegregada: grupoRow.cargaSegregada,
    paletesEsperados: grupoRow.paletesEsperados,
    observacao: grupoRow.observacao,
    status: grupoRow.status as DevolucaoGrupoDescargaStatus,
    createdAt: grupoRow.createdAt,
    updatedAt: grupoRow.updatedAt,
    startedAt: grupoRow.startedAt,
    finishedAt: grupoRow.finishedAt,
    demandas,
    itensEsperados,
    itensNaoContabeis: itensNaoContabeisRows.map((item) => ({
      id: item.id,
      sku: item.sku,
      descricaoProduto: item.descricaoProduto,
      quantidadeConferida: Number(item.quantidadeConferida),
      unidadeMedida: item.unidadeMedida,
      lote: item.lote,
      dataFabricacao: item.dataFabricacao,
      condicao: item.condicao as DevolucaoItemCondicao,
      observacao: item.observacao,
      status: item.status as DevolucaoItemNaoContabilStatus,
      demandaId: item.demandaId,
      createdAt: item.createdAt,
    })),
  };
}

export async function listarGruposDescargaDevolucaoDb(
  db: DrizzleClient,
  filter: { unidadeId: string; status?: DevolucaoGrupoDescargaStatus },
) {
  const conditions = [eq(devolucaoGruposDescarga.unidadeId, filter.unidadeId)];

  if (filter.status) {
    conditions.push(eq(devolucaoGruposDescarga.status, filter.status));
  }

  const grupoRows = await db
    .select({
      id: devolucaoGruposDescarga.id,
      codigoGrupo: devolucaoGruposDescarga.codigoGrupo,
      placaDescarga: devolucaoGruposDescarga.placaDescarga,
      doca: devolucaoGruposDescarga.doca,
      cargaSegregada: devolucaoGruposDescarga.cargaSegregada,
      paletesEsperados: devolucaoGruposDescarga.paletesEsperados,
      observacao: devolucaoGruposDescarga.observacao,
      status: devolucaoGruposDescarga.status,
      createdAt: devolucaoGruposDescarga.createdAt,
      updatedAt: devolucaoGruposDescarga.updatedAt,
      startedAt: devolucaoGruposDescarga.startedAt,
      finishedAt: devolucaoGruposDescarga.finishedAt,
    })
    .from(devolucaoGruposDescarga)
    .where(and(...conditions))
    .orderBy(desc(devolucaoGruposDescarga.createdAt));

  if (grupoRows.length === 0) {
    return { grupos: [] };
  }

  const grupoIds = grupoRows.map((grupo) => grupo.id);

  const links = await db
    .select({
      grupoId: devolucaoGrupoDemandas.grupoId,
      demandaId: devolucaoGrupoDemandas.demandaId,
    })
    .from(devolucaoGrupoDemandas)
    .where(inArray(devolucaoGrupoDemandas.grupoId, grupoIds));

  const demandaIds = [...new Set(links.map((link) => link.demandaId))];
  const demandasPorGrupo = new Map<string, string[]>();
  links.forEach((link) => {
    const atual = demandasPorGrupo.get(link.grupoId) ?? [];
    atual.push(link.demandaId);
    demandasPorGrupo.set(link.grupoId, atual);
  });

  const nfRows =
    demandaIds.length > 0
      ? await db
          .select({
            id: devolucaoNotasFiscais.id,
            demandaId: devolucaoNotasFiscais.demandaId,
          })
          .from(devolucaoNotasFiscais)
          .where(inArray(devolucaoNotasFiscais.demandaId, demandaIds))
      : [];

  const nfIds = nfRows.map((nf) => nf.id);
  const nfsPorDemanda = new Map<string, string[]>();
  nfRows.forEach((nf) => {
    const atual = nfsPorDemanda.get(nf.demandaId) ?? [];
    atual.push(nf.id);
    nfsPorDemanda.set(nf.demandaId, atual);
  });

  const itensPorNf = new Map<string, number>();
  const pesoPorNf = new Map<string, number>();

  if (nfIds.length > 0) {
    const itemRows = await db
      .select({
        devolucaoNfId: devolucaoItens.devolucaoNfId,
        pesoDevolvido: devolucaoItens.pesoDevolvido,
      })
      .from(devolucaoItens)
      .where(inArray(devolucaoItens.devolucaoNfId, nfIds));

    itemRows.forEach((item) => {
      itensPorNf.set(
        item.devolucaoNfId,
        (itensPorNf.get(item.devolucaoNfId) ?? 0) + 1,
      );
      if (item.pesoDevolvido !== null) {
        pesoPorNf.set(
          item.devolucaoNfId,
          (pesoPorNf.get(item.devolucaoNfId) ?? 0) +
            Number(item.pesoDevolvido),
        );
      }
    });
  }

  const grupos = grupoRows.map((grupo) => {
    const demandasDoGrupo = demandasPorGrupo.get(grupo.id) ?? [];
    let totalNfs = 0;
    let totalItens = 0;
    let pesoDevolvido = 0;

    demandasDoGrupo.forEach((demandaId) => {
      const nfs = nfsPorDemanda.get(demandaId) ?? [];
      totalNfs += nfs.length;
      nfs.forEach((nfId) => {
        totalItens += itensPorNf.get(nfId) ?? 0;
        pesoDevolvido += pesoPorNf.get(nfId) ?? 0;
      });
    });

    return {
      id: grupo.id,
      codigoGrupo: grupo.codigoGrupo,
      placaDescarga: grupo.placaDescarga,
      doca: grupo.doca,
      cargaSegregada: grupo.cargaSegregada,
      paletesEsperados: grupo.paletesEsperados,
      observacao: grupo.observacao,
      status: grupo.status as DevolucaoGrupoDescargaStatus,
      totalDemandas: demandasDoGrupo.length,
      totalNfs,
      totalItens,
      pesoDevolvido,
      createdAt: grupo.createdAt,
      updatedAt: grupo.updatedAt,
      startedAt: grupo.startedAt,
      finishedAt: grupo.finishedAt,
    };
  });

  return { grupos };
}
