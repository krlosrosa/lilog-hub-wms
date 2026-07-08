import { ApiClientError, request } from '@/lib/offline/api-client';

import type { RastreioStatus } from '../types/rastreio.schema';

export async function fetchRastreioStatus(
  token: string,
): Promise<RastreioStatus> {
  return request<RastreioStatus>(
    `/rastreio/${encodeURIComponent(token)}`,
  );
}

export { ApiClientError };
