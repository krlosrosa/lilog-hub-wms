import { apiRequest } from '@/lib/api';

import type {
  InteracaoTipoTransportadora,
  ProcessoDebitoDetalhe,
  ProcessoDebitoListItem,
  ProcessoDebitoStatus,
} from '../types/debito.types';

export type ListarDebitosParams = {
  unidadeId?: string;
  status?: ProcessoDebitoStatus;
};

export async function listarDebitos(
  params: ListarDebitosParams = {},
): Promise<ProcessoDebitoListItem[]> {
  const search = new URLSearchParams();

  if (params.unidadeId) {
    search.set('unidadeId', params.unidadeId);
  }

  if (params.status) {
    search.set('status', params.status);
  }

  const query = search.toString();
  const path = `/portal/cobranca/processos${query ? `?${query}` : ''}`;

  const response = await apiRequest<{ processos: ProcessoDebitoListItem[] }>(
    path,
  );

  return response.processos;
}

export async function buscarDebito(id: string): Promise<ProcessoDebitoDetalhe> {
  return apiRequest<ProcessoDebitoDetalhe>(`/portal/cobranca/processos/${id}`);
}

export async function uploadAnexoInteracao(
  processoDebitoId: string,
  arquivo: File,
): Promise<{ chave: string }> {
  const formData = new FormData();
  formData.append('processoDebitoId', processoDebitoId);
  formData.append('arquivo', arquivo);

  return apiRequest<{ chave: string }>('/portal/cobranca/upload', {
    method: 'POST',
    body: formData,
  });
}

/** @deprecated Use uploadAnexoInteracao */
export const uploadAnexoReplica = uploadAnexoInteracao;

export type SubmeterInteracaoInput = {
  processoId: string;
  tipo: InteracaoTipoTransportadora;
  descricao: string;
  anexoChaves: string[];
};

export async function submeterInteracao(input: SubmeterInteracaoInput) {
  return apiRequest<{
    id: string;
    processoDebitoId: string;
    autor: 'transportadora';
    tipo: InteracaoTipoTransportadora;
    descricao: string;
    anexoChaves: string[];
    createdAt: string;
    statusProcesso: ProcessoDebitoStatus;
  }>(`/portal/cobranca/processos/${input.processoId}/interacao`, {
    method: 'POST',
    body: JSON.stringify({
      tipo: input.tipo,
      descricao: input.descricao,
      anexoChaves: input.anexoChaves,
    }),
  });
}

/** @deprecated Use submeterInteracao */
export const submeterReplica = submeterInteracao;
