import type { DevolucaoFaltaPesoStatus } from '@/features/devolucao/types/devolucao-falta-peso.schema';

export const FALTA_PESO_STATUS_ATIVOS = [
  'pendente',
  'validada',
] as const satisfies readonly DevolucaoFaltaPesoStatus[];

export type FaltaPesoStatusAtivo = (typeof FALTA_PESO_STATUS_ATIVOS)[number];

export function isFaltaPesoAtiva(
  status: DevolucaoFaltaPesoStatus,
): status is FaltaPesoStatusAtivo {
  return (FALTA_PESO_STATUS_ATIVOS as readonly string[]).includes(status);
}
