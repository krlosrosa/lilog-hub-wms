import { and, eq, inArray } from 'drizzle-orm';

import {
  estimateTempoEsperadoDevolucaoMinutos,
  mapDemandaStatusToEtapa,
} from '../../../application/services/devolucao/map-devolucao-alocacao-etapa.js';
import type { DevolucaoAlocacaoComContexto } from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoAlocacoes,
  devolucaoItens,
  devolucaoNotasFiscais,
} from '../providers/drizzle/config/migrations/schema.js';
import { sessaoFuncionarios } from '../providers/drizzle/config/migrations/schema.js';

export async function listarAlocacoesPorSessaoDb(
  db: DrizzleClient,
  sessaoId: string,
  unidadeId: string,
): Promise<DevolucaoAlocacaoComContexto[]> {
  const alocacaoRows = await db
    .select({
      id: devolucaoAlocacoes.id,
      demandaId: devolucaoAlocacoes.demandaId,
      sessaoId: devolucaoAlocacoes.sessaoId,
      sessaoFuncionarioId: devolucaoAlocacoes.sessaoFuncionarioId,
      funcao: devolucaoAlocacoes.funcao,
      status: devolucaoAlocacoes.status,
      atribuidoEm: devolucaoAlocacoes.atribuidoEm,
      inicioEm: devolucaoAlocacoes.inicioEm,
      fimEm: devolucaoAlocacoes.fimEm,
      codigoDemanda: demandasDevolucao.codigoDemanda,
      demandaStatus: demandasDevolucao.status,
      placa: demandasDevolucao.placa,
      funcionarioId: sessaoFuncionarios.funcionarioId,
    })
    .from(devolucaoAlocacoes)
    .innerJoin(
      demandasDevolucao,
      eq(devolucaoAlocacoes.demandaId, demandasDevolucao.id),
    )
    .innerJoin(
      sessaoFuncionarios,
      eq(devolucaoAlocacoes.sessaoFuncionarioId, sessaoFuncionarios.id),
    )
    .where(
      and(
        eq(devolucaoAlocacoes.sessaoId, sessaoId),
        eq(demandasDevolucao.unidadeId, unidadeId),
        eq(devolucaoAlocacoes.status, 'em_andamento'),
      ),
    );

  if (alocacaoRows.length === 0) {
    return [];
  }

  const demandaIds = [...new Set(alocacaoRows.map((row) => row.demandaId))];

  const nfRows = await db
    .select({
      id: devolucaoNotasFiscais.id,
      demandaId: devolucaoNotasFiscais.demandaId,
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

  return alocacaoRows.map((row) => {
    const nfs = nfsPorDemandaId.get(row.demandaId) ?? [];
    const totalItens = nfs.reduce(
      (acc, nf) => acc + (itensPorNfId.get(nf.id) ?? 0),
      0,
    );
    const pesoDevolvido = nfs.reduce(
      (acc, nf) => acc + (pesoPorNfId.get(nf.id) ?? 0),
      0,
    );
    const primeiraNf = nfs[0];

    return {
      id: row.id,
      demandaId: row.demandaId,
      sessaoId: row.sessaoId,
      sessaoFuncionarioId: row.sessaoFuncionarioId,
      funcao: row.funcao,
      status: row.status,
      atribuidoEm: row.atribuidoEm,
      inicioEm: row.inicioEm,
      fimEm: row.fimEm,
      codigoDemanda: row.codigoDemanda,
      demandaStatus: row.demandaStatus,
      etapa: mapDemandaStatusToEtapa(row.demandaStatus),
      totalNfs: nfs.length,
      totalItens,
      pesoDevolvido,
      cliente: primeiraNf?.cliente ?? null,
      placa: row.placa,
      transporteId: primeiraNf?.transporteId ?? null,
      tempoEsperadoMinutos: estimateTempoEsperadoDevolucaoMinutos(
        totalItens,
        nfs.length,
      ),
      funcionarioId: row.funcionarioId,
    };
  });
}
