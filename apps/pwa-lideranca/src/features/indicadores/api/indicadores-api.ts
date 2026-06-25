import { request } from '@/lib/api-client';

import type { TorreControleSnapshot } from '@/features/indicadores/lib/torre-controle.schema';

export type TransporteApiItem = {
  id: string;
  uploadLoteId: string;
  rota: string;
  dataTransporte: string;
};

export type ListTransportesResponse = {
  transportes: TransporteApiItem[];
};

export type ObterTorreControleParams = {
  unidadeId: string;
  uploadLoteId: string;
  sessaoId?: string;
};

export function listTransportes(unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });

  return request<ListTransportesResponse>(
    `/expedicao/transportes?${params.toString()}`,
  );
}

export function obterTorreControleExpedicao(params: ObterTorreControleParams) {
  const search = new URLSearchParams({
    unidadeId: params.unidadeId,
    uploadLoteId: params.uploadLoteId,
  });

  if (params.sessaoId) {
    search.set('sessaoId', params.sessaoId);
  }

  return request<TorreControleSnapshot>(
    `/expedicao/torre-controle?${search.toString()}`,
  );
}
