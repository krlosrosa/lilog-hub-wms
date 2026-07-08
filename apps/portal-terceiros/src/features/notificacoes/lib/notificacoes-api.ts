import { apiRequest } from '@/lib/api';

export type PortalNotificacaoTipo =
  | 'novo_debito'
  | 'status_atualizado'
  | 'nova_interacao';

export type NotificacaoPortalItem = {
  id: string;
  tipo: PortalNotificacaoTipo;
  titulo: string;
  mensagem: string;
  rotaDestino: string;
  lida: boolean;
  createdAt: string;
};

export type ListarNotificacoesResponse = {
  notificacoes: NotificacaoPortalItem[];
  totalNaoLidas: number;
};

export async function listarNotificacoes(
  params: { apenasNaoLidas?: boolean; limit?: number } = {},
): Promise<ListarNotificacoesResponse> {
  const search = new URLSearchParams();

  if (params.apenasNaoLidas !== undefined) {
    search.set('apenasNaoLidas', String(params.apenasNaoLidas));
  }

  if (params.limit !== undefined) {
    search.set('limit', String(params.limit));
  }

  const query = search.toString();
  const path = `/portal/notificacoes${query ? `?${query}` : ''}`;

  return apiRequest<ListarNotificacoesResponse>(path);
}

export async function marcarNotificacoesLidas(ids: string[]): Promise<void> {
  await apiRequest<void>('/portal/notificacoes/lidas', {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  });
}
