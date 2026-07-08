import { and, desc, eq, inArray, notInArray } from 'drizzle-orm';

import type {
  DemandaDevolucaoListItem,
  DemandaDevolucaoStatus,
  DevolucaoGestaoStats,
  DevolucaoNotaFiscalTipo,
  ListarDemandasDevolucaoFilter,
  ListarDemandasDevolucaoResult,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoGrupoDemandas,
  devolucaoGruposDescarga,
  devolucaoItens,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';
import { demandaIdsEmGrupoAtivoDb } from './criar-grupo-descarga-devolucao.drizzle.js';

function createEmptyStats(): DevolucaoGestaoStats {
  return {
    total: 0,
    rascunho: 0,
    aberta: 0,
    emAnalise: 0,
    emExecucao: 0,
    conferida: 0,
    concluida: 0,
    cancelada: 0,
  };
}

function incrementStats(
  stats: DevolucaoGestaoStats,
  status: DemandaDevolucaoStatus,
): void {
  stats.total += 1;

  switch (status) {
    case 'rascunho':
      stats.rascunho += 1;
      break;
    case 'aberta':
      stats.aberta += 1;
      break;
    case 'em_analise':
      stats.emAnalise += 1;
      break;
    case 'em_execucao':
      stats.emExecucao += 1;
      break;
    case 'conferida':
      stats.conferida += 1;
      break;
    case 'concluida':
      stats.concluida += 1;
      break;
    case 'cancelada':
      stats.cancelada += 1;
      break;
  }
}

export async function listarDemandasDevolucaoDb(
  db: DrizzleClient,
  filter: ListarDemandasDevolucaoFilter,
): Promise<ListarDemandasDevolucaoResult> {
  const statsRows = await db
    .select({
      status: demandasDevolucao.status,
    })
    .from(demandasDevolucao)
    .where(eq(demandasDevolucao.unidadeId, filter.unidadeId));

  const stats = createEmptyStats();
  statsRows.forEach((row) => incrementStats(stats, row.status));

  const demandaConditions = [eq(demandasDevolucao.unidadeId, filter.unidadeId)];

  if (filter.status) {
    demandaConditions.push(eq(demandasDevolucao.status, filter.status));
  }

  if (filter.semGrupo) {
    const demandasEmGrupo = await demandaIdsEmGrupoAtivoDb(db, filter.unidadeId);
    if (demandasEmGrupo.size > 0) {
      demandaConditions.push(
        notInArray(demandasDevolucao.id, [...demandasEmGrupo]),
      );
    }
  }

  const demandaRows = await db
    .select({
      id: demandasDevolucao.id,
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
    .where(and(...demandaConditions))
    .orderBy(desc(demandasDevolucao.createdAt));

  if (demandaRows.length === 0) {
    return { demandas: [], stats };
  }

  const demandaIds = demandaRows.map((row) => row.id);

  const grupoLinks =
    demandaIds.length > 0
      ? await db
          .select({
            demandaId: devolucaoGrupoDemandas.demandaId,
            grupoId: devolucaoGrupoDemandas.grupoId,
            codigoGrupo: devolucaoGruposDescarga.codigoGrupo,
          })
          .from(devolucaoGrupoDemandas)
          .innerJoin(
            devolucaoGruposDescarga,
            eq(devolucaoGrupoDemandas.grupoId, devolucaoGruposDescarga.id),
          )
          .where(inArray(devolucaoGrupoDemandas.demandaId, demandaIds))
      : [];

  const grupoPorDemanda = new Map<
    string,
    { grupoId: string; codigoGrupo: string }
  >();
  grupoLinks.forEach((link) => {
    grupoPorDemanda.set(link.demandaId, {
      grupoId: link.grupoId,
      codigoGrupo: link.codigoGrupo,
    });
  });

  const nfRows = await db
    .select({
      id: devolucaoNotasFiscais.id,
      demandaId: devolucaoNotasFiscais.demandaId,
      tipo: devolucaoNotasFiscais.tipo,
      transporteId: devolucaoNotasFiscais.transporteId,
      cliente: devolucaoNotasFiscais.cliente,
    })
    .from(devolucaoNotasFiscais)
    .where(inArray(devolucaoNotasFiscais.demandaId, demandaIds));

  const nfIds = nfRows.map((row) => row.id);
  const itensPorNfId = new Map<string, number>();
  const pesoPorNfId = new Map<string, number>();

  if (nfIds.length > 0) {
    const itemRows = await db
      .select({
        devolucaoNfId: devolucaoItens.devolucaoNfId,
        pesoDevolvido: devolucaoItens.pesoDevolvido,
      })
      .from(devolucaoItens)
      .where(inArray(devolucaoItens.devolucaoNfId, nfIds));

    itemRows.forEach((row) => {
      itensPorNfId.set(
        row.devolucaoNfId,
        (itensPorNfId.get(row.devolucaoNfId) ?? 0) + 1,
      );

      if (row.pesoDevolvido !== null) {
        pesoPorNfId.set(
          row.devolucaoNfId,
          (pesoPorNfId.get(row.devolucaoNfId) ?? 0) +
            Number(row.pesoDevolvido),
        );
      }
    });
  }

  const nfsPorDemandaId = new Map<string, typeof nfRows>();

  nfRows.forEach((nf) => {
    const atual = nfsPorDemandaId.get(nf.demandaId) ?? [];
    atual.push(nf);
    nfsPorDemandaId.set(nf.demandaId, atual);
  });

  const demandas: DemandaDevolucaoListItem[] = demandaRows.map((demanda) => {
    const nfs = nfsPorDemandaId.get(demanda.id) ?? [];
    const tiposNf = [
      ...new Set(nfs.map((nf) => nf.tipo)),
    ] as DevolucaoNotaFiscalTipo[];

    const totalItens = nfs.reduce(
      (acc, nf) => acc + (itensPorNfId.get(nf.id) ?? 0),
      0,
    );

    const pesoDevolvido = nfs.reduce(
      (acc, nf) => acc + (pesoPorNfId.get(nf.id) ?? 0),
      0,
    );

    const primeiraNf = nfs[0];
    const grupo = grupoPorDemanda.get(demanda.id);

    return {
      id: demanda.id,
      codigoDemanda: demanda.codigoDemanda,
      status: demanda.status,
      observacao: demanda.observacao,
      createdAt: demanda.createdAt,
      updatedAt: demanda.updatedAt,
      concluidaAt: demanda.concluidaAt,
      totalNfs: nfs.length,
      totalItens,
      pesoDevolvido,
      transporteId: primeiraNf?.transporteId ?? null,
      placa: demanda.placa,
      cliente: primeiraNf?.cliente ?? null,
      tiposNf,
      doca: demanda.doca,
      cargaSegregada: demanda.cargaSegregada,
      paletesEsperados: demanda.paletesEsperados,
      grupoDescargaId: grupo?.grupoId ?? null,
      codigoGrupo: grupo?.codigoGrupo ?? null,
    };
  });

  return { demandas, stats };
}
