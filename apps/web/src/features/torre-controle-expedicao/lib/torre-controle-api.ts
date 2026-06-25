import { apiRequest } from '@/lib/api';

import type { TorreControleSnapshot } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

export type ObterTorreControleParams = {
  unidadeId: string;
  uploadLoteId: string;
  sessaoId?: string;
};

export function obterTorreControleExpedicao(params: ObterTorreControleParams) {
  const search = new URLSearchParams({
    unidadeId: params.unidadeId,
    uploadLoteId: params.uploadLoteId,
  });

  if (params.sessaoId) {
    search.set('sessaoId', params.sessaoId);
  }

  return apiRequest<TorreControleSnapshot>(
    `/expedicao/torre-controle?${search.toString()}`,
  );
}
