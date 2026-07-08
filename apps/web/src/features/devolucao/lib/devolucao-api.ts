import { apiRequest } from '@/lib/api';

import type {
  BuscarDemandaDevolucaoResponse,
  DeletarDemandaDevolucaoResponse,
  ListarAvariasDevolucaoResponse,
} from '@/features/devolucao/types/devolucao-buscar.schema';
import type {
  AtualizarFaltaPesoPayload,
  FaltaPesoDetalhe,
  ListarFaltasPesoResponse,
  RegistrarFaltaPesoPayload,
  RegistrarFaltaPesoResponse,
  ValidarFaltaPesoPayload,
} from '@/features/devolucao/types/devolucao-falta-peso.schema';
import type {
  DemandaDevolucaoListItem,
  DemandaDevolucaoStatus,
  DevolucaoGestaoStats,
} from '@/features/devolucao/types/devolucao-gestao.schema';
import type {
  DevolucaoGrupoDescargaStatus,
  GrupoDescargaListItem,
} from '@/features/devolucao/types/devolucao-grupo-descarga.schema';

export type ListarDemandasDevolucaoResponse = {
  demandas: DemandaDevolucaoListItem[];
  stats: DevolucaoGestaoStats;
};

export type AtualizarStatusDemandaPayload = {
  status: DemandaDevolucaoStatus;
  observacao?: string;
  doca?: string | null;
  cargaSegregada?: boolean;
  paletesEsperados?: number | null;
};

export type AtualizarStatusDemandaResponse = {
  id: string;
  codigoDemanda: string;
  status: DemandaDevolucaoStatus;
  statusAnterior: DemandaDevolucaoStatus;
  updatedAt: string;
  concluidaAt: string | null;
};

export type IncluirDemandaManualPayload = {
  unidadeId: string;
  viagemId?: number;
  numeroTransporte?: string;
};

export type IncluirDemandaManualResponse = {
  created: boolean;
  demanda: {
    id: string;
    codigoDemanda: string;
    status: string;
  } | null;
};

export function listarDemandasDevolucao(
  unidadeId: string,
  status?: DemandaDevolucaoStatus,
  semGrupo?: boolean,
) {
  const params = new URLSearchParams({ unidadeId });

  if (status) {
    params.set('status', status);
  }

  if (semGrupo) {
    params.set('semGrupo', 'true');
  }

  return apiRequest<ListarDemandasDevolucaoResponse>(
    `/devolucao/demandas?${params.toString()}`,
  );
}

export function atualizarStatusDemanda(
  demandaId: string,
  unidadeId: string,
  payload: AtualizarStatusDemandaPayload,
) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<AtualizarStatusDemandaResponse>(
    `/devolucao/demandas/${demandaId}/status?${params.toString()}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function incluirDemandaManual(payload: IncluirDemandaManualPayload) {
  return apiRequest<IncluirDemandaManualResponse>('/devolucao/demandas/manual', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function buscarDemandaDevolucao(demandaId: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<BuscarDemandaDevolucaoResponse>(
    `/devolucao/demandas/${demandaId}?${params.toString()}`,
  );
}

export function listarAvariasDevolucao(demandaId: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<ListarAvariasDevolucaoResponse>(
    `/devolucao/demandas/${demandaId}/avarias?${params.toString()}`,
  );
}

export function deletarDemandaDevolucao(demandaId: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<DeletarDemandaDevolucaoResponse>(
    `/devolucao/demandas/${demandaId}?${params.toString()}`,
    {
      method: 'DELETE',
    },
  );
}

export type ConferenciaDemandaStatus =
  | 'em_analise'
  | 'em_execucao'
  | 'conferida'
  | 'concluida';

export type RegistrarConferenciaItemPayload = {
  itemId: string;
  condicao?: 'integro' | 'avariado' | 'vencido' | 'violado' | 'nao_identificado';
  qtdConferida: number;
  lote?: string | null;
  dataFabricacao?: string | null;
  observacao?: string | null;
};

export type RegistrarConferenciaItensPayload = {
  unidadeId: string;
  status?: ConferenciaDemandaStatus;
  itens?: RegistrarConferenciaItemPayload[];
};

export type RegistrarConferenciaItensResponse = {
  demandaId: string;
  itensAtualizados: number;
  status?: DemandaDevolucaoStatus;
};

export function registrarConferenciaItens(
  demandaId: string,
  payload: RegistrarConferenciaItensPayload,
) {
  return apiRequest<RegistrarConferenciaItensResponse>(
    `/devolucao/demandas/${demandaId}/conferencia`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export type SalvarChecklistDevolucaoPayload = {
  dock: string;
  paletesRecebidos: number;
  tempBau?: number;
  tempProduto?: number;
  conditions: Record<string, boolean>;
  observacoes?: string;
  photoCount?: number;
};

export type SalvarChecklistDevolucaoResponse = {
  id: string;
  demandaId: string;
};

export function salvarChecklistDevolucao(
  demandaId: string,
  unidadeId: string,
  payload: SalvarChecklistDevolucaoPayload,
) {
  const params = new URLSearchParams({ unidadeId });

  return apiRequest<SalvarChecklistDevolucaoResponse>(
    `/devolucao/demandas/${demandaId}/checklist?${params.toString()}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export type RegistrarAvariaDevolucaoPayload = {
  unidadeId: string;
  itemId?: string | null;
  tipo: string;
  natureza?: string | null;
  causa?: string | null;
  quantidadeCaixa?: number | null;
  quantidadeUnidade?: number | null;
  observacao?: string | null;
  photoUrls?: string[];
  replicarSkus?: string[];
};

export type RegistrarAvariaDevolucaoResponse = {
  id: string;
  demandaId: string;
  itemId: string | null;
  itensAfetados: number;
};

export function registrarAvariaDevolucao(
  demandaId: string,
  payload: RegistrarAvariaDevolucaoPayload,
) {
  return apiRequest<RegistrarAvariaDevolucaoResponse>(
    `/devolucao/demandas/${demandaId}/avarias`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export type DocumentoApi = {
  id: string;
  nome: string;
  chave: string;
  mimeType: string;
  tamanho: number;
  entidadeTipo: string | null;
  entidadeId: string | null;
  status: 'pending' | 'ativo' | 'deletado';
  uploadedBy: number | null;
  createdAt: string;
};

export async function listChecklistDevolucaoDocumentos(
  demandaId: string,
): Promise<DocumentoApi[]> {
  const params = new URLSearchParams({
    entidadeTipo: 'checklist_devolucao',
    entidadeId: demandaId,
    status: 'ativo',
    page: '1',
    limit: '50',
  });

  const result = await apiRequest<{ items: DocumentoApi[] }>(
    `/documentos?${params.toString()}`,
  );

  return result.items ?? [];
}

export async function getDocumentDownloadUrl(
  documentoId: string,
): Promise<string> {
  const result = await apiRequest<{ downloadUrl: string }>(
    `/documentos/${encodeURIComponent(documentoId)}/url`,
  );

  return result.downloadUrl;
}

export function listarFaltasPesoDevolucao(
  demandaId: string,
  unidadeId: string,
  status?: 'pendente' | 'validada' | 'rejeitada',
) {
  const params = new URLSearchParams({ unidadeId });

  if (status) {
    params.set('status', status);
  }

  return apiRequest<ListarFaltasPesoResponse>(
    `/devolucao/demandas/${demandaId}/faltas-peso?${params.toString()}`,
  );
}

export function registrarFaltaPesoDevolucao(
  demandaId: string,
  payload: RegistrarFaltaPesoPayload,
) {
  return apiRequest<RegistrarFaltaPesoResponse>(
    `/devolucao/demandas/${demandaId}/faltas-peso`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function atualizarFaltaPesoDevolucao(
  demandaId: string,
  faltaPesoId: string,
  payload: AtualizarFaltaPesoPayload,
) {
  return apiRequest<FaltaPesoDetalhe>(
    `/devolucao/demandas/${demandaId}/faltas-peso/${faltaPesoId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  );
}

export function validarFaltaPesoDevolucao(
  demandaId: string,
  faltaPesoId: string,
  payload: ValidarFaltaPesoPayload,
) {
  return apiRequest<FaltaPesoDetalhe>(
    `/devolucao/demandas/${demandaId}/faltas-peso/${faltaPesoId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export type ListarGruposDescargaResponse = {
  grupos: GrupoDescargaListItem[];
};

export type CriarGrupoDescargaPayload = {
  unidadeId: string;
  demandaIds: string[];
  placaDescarga: string;
  doca?: string | null;
  cargaSegregada?: boolean;
  paletesEsperados?: number | null;
  observacao?: string | null;
  liberarConferencia?: boolean;
};

export type CriarGrupoDescargaResponse = {
  id: string;
  codigoGrupo: string;
  status: DevolucaoGrupoDescargaStatus;
  totalDemandas: number;
};

export type GrupoDescargaDetalhe = {
  id: string;
  codigoGrupo: string;
  placaDescarga: string;
  doca: string | null;
  cargaSegregada: boolean;
  paletesEsperados: number | null;
  observacao: string | null;
  status: DevolucaoGrupoDescargaStatus;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  demandas: Array<{
    id: string;
    codigoDemanda: string;
    placa: string | null;
    status: string;
    totalNfs: number;
    totalItens: number;
    pesoDevolvido: number;
  }>;
  itensEsperados: Array<{
    itemId: string;
    demandaId: string;
    codigoDemanda: string;
    notaFiscalId: string;
    numeroNf: string;
    sku: string;
    descricaoProduto: string | null;
    quantidade: number;
    qtdConferida: number | null;
    unidadeMedida: string;
    condicao: string;
    pesoVariavel: boolean;
  }>;
  itensNaoContabeis: Array<{
    id: string;
    sku: string;
    descricaoProduto: string | null;
    quantidadeConferida: number;
    unidadeMedida: string;
    lote: string | null;
    dataFabricacao: string | null;
    condicao: string;
    observacao: string | null;
    status: string;
    demandaId: string | null;
    createdAt: string;
  }>;
};

export function listarGruposDescargaDevolucao(
  unidadeId: string,
  status?: DevolucaoGrupoDescargaStatus,
) {
  const params = new URLSearchParams({ unidadeId });
  if (status) params.set('status', status);
  return apiRequest<ListarGruposDescargaResponse>(
    `/devolucao/grupos-descarga?${params.toString()}`,
  );
}

export function buscarGrupoDescargaDevolucao(grupoId: string, unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });
  return apiRequest<GrupoDescargaDetalhe>(
    `/devolucao/grupos-descarga/${grupoId}?${params.toString()}`,
  );
}

export function criarGrupoDescargaDevolucao(payload: CriarGrupoDescargaPayload) {
  return apiRequest<CriarGrupoDescargaResponse>('/devolucao/grupos-descarga', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function atualizarStatusGrupoDescarga(
  grupoId: string,
  payload: { unidadeId: string; status: DevolucaoGrupoDescargaStatus; observacao?: string },
) {
  return apiRequest<{ id: string; codigoGrupo: string; status: DevolucaoGrupoDescargaStatus }>(
    `/devolucao/grupos-descarga/${grupoId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export type RegistrarConferenciaGrupoPayload = {
  unidadeId: string;
  status?: DevolucaoGrupoDescargaStatus;
  itens?: Array<{
    itemId: string;
    qtdConferida: number;
    condicao?: string;
    lote?: string | null;
    dataFabricacao?: string | null;
    observacao?: string | null;
  }>;
  itensNaoContabeis?: Array<{
    sku: string;
    descricaoProduto?: string | null;
    quantidadeConferida: number;
    unidadeMedida: string;
    lote?: string | null;
    dataFabricacao?: string | null;
    condicao?: string;
    observacao?: string | null;
    demandaId?: string | null;
  }>;
};

export function registrarConferenciaGrupo(
  grupoId: string,
  payload: RegistrarConferenciaGrupoPayload,
) {
  return apiRequest<{
    grupoId: string;
    itensAtualizados: number;
    itensNaoContabeisRegistrados: number;
    status?: DevolucaoGrupoDescargaStatus;
    demandasAtualizadas: string[];
  }>(`/devolucao/grupos-descarga/${grupoId}/conferencia`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
