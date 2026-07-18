import type { DemandPatchRequest, DemandPatchResult } from '@lilog/contracts';

import { request } from '@/lib/offline/api-client';

export async function pushDemandPatch(
  demandId: string,
  body: DemandPatchRequest,
): Promise<DemandPatchResult> {
  return request<DemandPatchResult>(
    `/pwa/sync/recebimento-v2/demands/${encodeURIComponent(demandId)}/push`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}
