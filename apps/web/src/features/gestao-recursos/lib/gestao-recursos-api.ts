import { apiRequest } from '@/lib/api';

import type {
  AddFuncionarioDemandaPayload,
  CriarAlocacaoDevolucaoApiResponse,
  CriarAlocacaoDevolucaoPayload,
  CriarDemandasApiResponse,
  CriarDemandasPayload,
  DemandaFuncionarioApi,
  DemandaSeparacaoApi,
  ListMapasGrupoDisponiveisApiResponse,
  MapaGrupoProcessoApi,
  MapasResumoTransportesApiResponse,
  RecursosDevolucaoSessaoApiResponse,
  RecursosSessaoApiResponse,
} from '@/features/gestao-recursos/types/gestao-recursos.api';

export function getRecursosSessao(sessaoId: string) {
  return apiRequest<RecursosSessaoApiResponse>(
    `/op-wms/sessoes/${sessaoId}/recursos`,
  );
}

export function listMapasGrupoDisponiveis(
  sessaoId: string,
  options?: { processo?: MapaGrupoProcessoApi },
) {
  const params = new URLSearchParams();
  if (options?.processo) {
    params.set('processo', options.processo);
  }
  const query = params.toString();
  const suffix = query ? `?${query}` : '';

  return apiRequest<ListMapasGrupoDisponiveisApiResponse>(
    `/op-wms/sessoes/${sessaoId}/mapas-grupo-disponiveis${suffix}`,
  );
}

export function getMapasResumoTransportes(
  unidadeId: string,
  transporteIds: string[],
) {
  const params = new URLSearchParams({ unidadeId });
  transporteIds.forEach((id) => params.append('transporteIds', id));

  return apiRequest<MapasResumoTransportesApiResponse>(
    `/op-wms/mapas-resumo-transportes?${params.toString()}`,
  );
}

export function criarDemandas(payload: CriarDemandasPayload) {
  return apiRequest<CriarDemandasApiResponse>('/op-wms/demandas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function finalizarDemandaSeparacao(demandaId: string) {
  return apiRequest<DemandaSeparacaoApi>(
    `/op-wms/demandas/${demandaId}/finalizar`,
    { method: 'POST' },
  );
}

export function addFuncionarioDemandaCarregamento(
  demandaId: string,
  payload: AddFuncionarioDemandaPayload,
) {
  return apiRequest<DemandaFuncionarioApi>(
    `/op-wms/demandas/${demandaId}/funcionarios`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function removeFuncionarioDemandaCarregamento(
  demandaId: string,
  sessaoFuncionarioId: string,
) {
  return apiRequest<void>(
    `/op-wms/demandas/${demandaId}/funcionarios/${sessaoFuncionarioId}`,
    { method: 'DELETE' },
  );
}

export function getRecursosDevolucaoSessao(sessaoId: string) {
  return apiRequest<RecursosDevolucaoSessaoApiResponse>(
    `/devolucao/sessoes/${sessaoId}/recursos`,
  );
}

export function alocarOperadorDemandaDevolucao(
  payload: CriarAlocacaoDevolucaoPayload,
) {
  return apiRequest<CriarAlocacaoDevolucaoApiResponse>('/devolucao/alocacoes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function removerAlocacaoDevolucao(alocacaoId: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });
  return apiRequest<{ id: string; demandaId: string }>(
    `/devolucao/alocacoes/${alocacaoId}?${params.toString()}`,
    { method: 'DELETE' },
  );
}
