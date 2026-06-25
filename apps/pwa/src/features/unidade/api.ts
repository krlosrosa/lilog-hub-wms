import { request } from '@/lib/offline/api-client';

import type { ListMyUnidadesResponse } from './types';

export async function listMyUnidadesApi(): Promise<ListMyUnidadesResponse> {
  return request<ListMyUnidadesResponse>('/auth/me/unidades');
}
