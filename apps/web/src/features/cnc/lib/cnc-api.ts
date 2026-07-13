import { apiRequest } from '@/lib/api';

import type {
  CncDetalhe,
  CncListItem,
  CncResponsavel,
  CncSituacao,
  CncTratativa,
  CncTratativaTipo,
} from '@/features/cnc/types/cnc.schema';
import type { CncImpressaoOpcoes } from '@/features/cnc/types/cnc-impressao.schema';

export type CncApiResponse = {
  id: string;
  numero: string;
  origem: 'recebimento';
  origemId: string;
  unidadeId: string;
  responsavel: CncResponsavel;
  responsavelId: string | null;
  descricao: string | null;
  observacao: string | null;
  situacao: CncSituacao;
  solicitanteId: number;
  analistaId: number | null;
  iniciadoEm: string | null;
  encerradoEm: string | null;
  encerradoPorUserId: number | null;
  valorDebito: number | null;
  opcoesImpressao?: CncImpressaoOpcoes | null;
  itens?: CncDetalhe['itens'];
  tratativas?: CncTratativa[];
  eventos?: CncDetalhe['eventos'];
  createdAt: string;
  updatedAt: string;
};

export type ListarCncsResponse = {
  items: CncApiResponse[];
  total: number;
  page: number;
  limit: number;
};

export type ListarCncsFilters = {
  page?: number;
  limit?: number;
  situacao?: CncSituacao;
  origemId?: string;
};

export type ListarCncItensFilters = {
  page?: number;
  limit?: number;
  dataInicio: string;
  dataFim: string;
  situacao?: CncSituacao;
  tipo?: CncDetalhe['itens'][number]['tipo'];
};

export type ListarCncItensResponse = {
  items: Array<
    CncDetalhe['itens'][number] & {
      cncNumero: string;
      cncSituacao: CncSituacao;
    }
  >;
  total: number;
  page: number;
  limit: number;
};

export function listarCncItens(
  unidadeId: string,
  filters: ListarCncItensFilters,
) {
  const params = new URLSearchParams({ unidadeId });

  if (filters.page) {
    params.set('page', String(filters.page));
  }

  if (filters.limit) {
    params.set('limit', String(filters.limit));
  }

  params.set('dataInicio', filters.dataInicio);
  params.set('dataFim', filters.dataFim);

  if (filters.situacao) {
    params.set('situacao', filters.situacao);
  }

  if (filters.tipo) {
    params.set('tipo', filters.tipo);
  }

  return apiRequest<ListarCncItensResponse>(`/cncs/itens?${params.toString()}`);
}

export function listarCncs(unidadeId: string, filters?: ListarCncsFilters) {
  const params = new URLSearchParams({ unidadeId });

  if (filters?.page) {
    params.set('page', String(filters.page));
  }

  if (filters?.limit) {
    params.set('limit', String(filters.limit));
  }

  if (filters?.situacao) {
    params.set('situacao', filters.situacao);
  }

  if (filters?.origemId) {
    params.set('origemId', filters.origemId);
  }

  return apiRequest<ListarCncsResponse>(`/cncs?${params.toString()}`);
}

export function buscarCnc(cncId: string) {
  return apiRequest<CncApiResponse>(`/cncs/${cncId}`);
}

export function iniciarAnaliseCnc(cncId: string) {
  return apiRequest<CncApiResponse>(`/cncs/${cncId}/iniciar-analise`, {
    method: 'PUT',
  });
}

export type EncerrarCncBody = {
  responsavel?: CncResponsavel;
  responsavelId?: string | null;
  valorDebito?: number | null;
  observacao?: string | null;
};

export function encerrarCnc(cncId: string, body: EncerrarCncBody) {
  return apiRequest<CncApiResponse>(`/cncs/${cncId}/encerrar`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export type CancelarCncBody = {
  observacao: string;
};

export function cancelarCnc(cncId: string, body: CancelarCncBody) {
  return apiRequest<CncApiResponse>(`/cncs/${cncId}/cancelar`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export type AdicionarTratativaBody = {
  tipo: CncTratativaTipo;
  descricao: string;
  responsavelTipo: CncResponsavel;
  prazo?: string | null;
};

export function adicionarTratativa(cncId: string, body: AdicionarTratativaBody) {
  return apiRequest<CncTratativa>(`/cncs/${cncId}/tratativas`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export type ListarTratativasResponse = {
  items: CncTratativa[];
};

export function listarTratativas(cncId: string) {
  return apiRequest<ListarTratativasResponse>(`/cncs/${cncId}/tratativas`);
}

export function concluirTratativa(cncId: string, tratativaId: string) {
  return apiRequest<CncTratativa>(
    `/cncs/${cncId}/tratativas/${tratativaId}/concluir`,
    {
      method: 'PUT',
    },
  );
}

export type UpdateObservacaoCncBody = {
  observacao: string | null;
};

export function atualizarObservacaoCnc(
  cncId: string,
  body: UpdateObservacaoCncBody,
) {
  return apiRequest<CncApiResponse>(`/cncs/${cncId}/observacao`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function atualizarOpcoesImpressaoCnc(
  cncId: string,
  body: CncImpressaoOpcoes,
) {
  return apiRequest<CncApiResponse>(`/cncs/${cncId}/opcoes-impressao`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type UpdateCncItemBody = {
  quantidadeEsperada?: number | null;
  quantidadeRecebida?: number | null;
  quantidadeDivergente?: number | null;
  pesoEsperado?: number | null;
  pesoRecebido?: number | null;
};

export function atualizarItemCnc(
  cncId: string,
  itemId: string,
  body: UpdateCncItemBody,
) {
  return apiRequest<CncDetalhe['itens'][number]>(
    `/cncs/${cncId}/itens/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  );
}

export function removerItemCnc(cncId: string, itemId: string) {
  return apiRequest<CncDetalhe['itens'][number]>(
    `/cncs/${cncId}/itens/${itemId}`,
    {
      method: 'DELETE',
    },
  );
}

export function mapCncApiToListItem(cnc: CncApiResponse): CncListItem {
  return {
    id: cnc.id,
    numero: cnc.numero,
    origem: cnc.origem,
    origemId: cnc.origemId,
    unidadeId: cnc.unidadeId,
    responsavel: cnc.responsavel,
    responsavelId: cnc.responsavelId,
    descricao: cnc.descricao,
    situacao: cnc.situacao,
    valorDebito: cnc.valorDebito,
    createdAt: cnc.createdAt,
    updatedAt: cnc.updatedAt,
  };
}

export function mapCncApiToDetalhe(cnc: CncApiResponse): CncDetalhe {
  return {
    ...mapCncApiToListItem(cnc),
    observacao: cnc.observacao,
    solicitanteId: cnc.solicitanteId,
    analistaId: cnc.analistaId,
    iniciadoEm: cnc.iniciadoEm,
    encerradoEm: cnc.encerradoEm,
    encerradoPorUserId: cnc.encerradoPorUserId,
    opcoesImpressao: cnc.opcoesImpressao ?? null,
    itens: cnc.itens ?? [],
    tratativas: cnc.tratativas ?? [],
    eventos: cnc.eventos ?? [],
  };
}

export function computeCncKpi(items: CncListItem[]): {
  total: number;
  pendentes: number;
  emAnalise: number;
  encerradas: number;
  canceladas: number;
} {
  return {
    total: items.length,
    pendentes: items.filter((item) => item.situacao === 'pendente').length,
    emAnalise: items.filter((item) => item.situacao === 'em_analise').length,
    encerradas: items.filter((item) => item.situacao === 'encerrada').length,
    canceladas: items.filter((item) => item.situacao === 'cancelada').length,
  };
}
