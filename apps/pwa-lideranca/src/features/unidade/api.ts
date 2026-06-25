import { request } from '@/lib/api-client';

import type { ListMyUnidadesResponse } from './types';

export async function listMyUnidadesApi(): Promise<ListMyUnidadesResponse> {
  return request<ListMyUnidadesResponse>('/auth/me/unidades');
}
