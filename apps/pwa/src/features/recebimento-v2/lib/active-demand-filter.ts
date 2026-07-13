import type { DemandRecord, ProcessRecord } from '../local-db/schema';

/** Situações retornadas pela API de demandas do operador. */
export const ACTIVE_DEMAND_SITUACOES = new Set([
  'liberado_para_conferencia',
  'em_conferencia',
  'impedido',
]);

export function isActiveDemandProcess(
  process: ProcessRecord,
  demand?: DemandRecord | null,
): boolean {
  if (process.status === 'completed') {
    return false;
  }

  if (demand?.situacao) {
    return ACTIVE_DEMAND_SITUACOES.has(demand.situacao);
  }

  return process.status !== 'completed';
}
