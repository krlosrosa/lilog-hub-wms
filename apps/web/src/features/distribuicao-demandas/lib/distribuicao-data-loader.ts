import { listDocas } from '@/features/docas/lib/docas-api';
import {
  getMapasResumoTransportes,
  getRecursosSessao,
  listMapasGrupoDisponiveis,
} from '@/features/gestao-recursos/lib/gestao-recursos-api';
import {
  mapDistribuicaoExecucao,
  mapPlanejamentoDistribuicao,
} from '@/features/distribuicao-demandas/lib/map-distribuicao-data';
import type {
  DistribuicaoDadosCarregados,
  PlanejamentoDistribuicaoCarregado,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';
import { listTransportes } from '@/features/transporte/lib/expedicao-api';

export async function carregarPlanejamentoDistribuicao(
  unidadeId: string,
  transporteIds: string[] = [],
): Promise<PlanejamentoDistribuicaoCarregado> {
  const [transportesResp, docasResp, resumoResp] = await Promise.all([
    listTransportes(unidadeId),
    listDocas({ unidadeId, limit: 100 }),
    transporteIds.length > 0
      ? getMapasResumoTransportes(unidadeId, transporteIds)
      : Promise.resolve({ items: [] }),
  ]);

  const resumoPorTransporte = new Map(
    resumoResp.items.map((item) => [item.transporteId, item]),
  );

  return mapPlanejamentoDistribuicao({
    transportes: transportesResp.transportes,
    docas: docasResp.items,
    resumoPorTransporte,
  });
}

export async function carregarDadosExecucaoDistribuicao(
  unidadeId: string,
  sessaoId: string,
  transporteIds: string[],
): Promise<DistribuicaoDadosCarregados> {
  const [
    transportesResp,
    mapasSeparacaoResp,
    mapasConferenciaResp,
    mapasCarregamentoResp,
    recursosResp,
    docasResp,
  ] = await Promise.all([
    listTransportes(unidadeId),
    listMapasGrupoDisponiveis(sessaoId, { processo: 'separacao' }),
    listMapasGrupoDisponiveis(sessaoId, { processo: 'conferencia' }),
    listMapasGrupoDisponiveis(sessaoId, { processo: 'carregamento' }),
    getRecursosSessao(sessaoId),
    listDocas({ unidadeId, limit: 100 }),
  ]);

  return mapDistribuicaoExecucao({
    sessaoId,
    transportes: transportesResp.transportes,
    transporteIds,
    mapasSeparacao: mapasSeparacaoResp.items,
    mapasConferencia: mapasConferenciaResp.items,
    mapasCarregamento: mapasCarregamentoResp.items,
    funcionarios: recursosResp.funcionarios,
    docas: docasResp.items,
  });
}

/** @deprecated Use carregarPlanejamentoDistribuicao ou carregarDadosExecucaoDistribuicao */
export async function carregarDadosDistribuicao(
  unidadeId: string,
  sessaoId: string,
): Promise<DistribuicaoDadosCarregados> {
  const planejamento = await carregarPlanejamentoDistribuicao(unidadeId);
  const ids = planejamento.transportes.map((t) => t.id);
  return carregarDadosExecucaoDistribuicao(unidadeId, sessaoId, ids);
}
