import { apiRequest } from '@/lib/api';

import type { RecebimentoPainelSnapshot } from '@/features/recebimento-painel/types/recebimento-painel.schema';

export type GetRecebimentoPainelSnapshotParams = {
  unidadeId: string;
  dataInicio: string;
  dataFim: string;
  dataReferencia: string;
};

export function getRecebimentoPainelSnapshot(
  params: GetRecebimentoPainelSnapshotParams,
) {
  const search = new URLSearchParams({
    unidadeId: params.unidadeId,
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
    dataReferencia: params.dataReferencia,
  });

  return apiRequest<RecebimentoPainelSnapshot>(
    `/recebimentos/painel/snapshot?${search.toString()}`,
  );
}
