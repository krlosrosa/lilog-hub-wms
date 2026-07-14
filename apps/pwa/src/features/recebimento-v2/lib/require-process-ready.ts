import type { ProcessStatus } from '@lilog/contracts';
import { redirect } from '@tanstack/react-router';

import { ensureRecebimentoV2DbReady, recebimentoV2Db } from '../local-db/db';

export const PROCESS_READY_FOR_CONFERENCE_STATUSES: ProcessStatus[] = [
  'ready',
  'working',
  'pendingSync',
  'completed',
];

const PREPARATION_ROUTE_SUFFIXES = ['/preparacao', '/conflito'] as const;

export function isProcessReadyStatus(status: ProcessStatus | undefined): boolean {
  return status != null && PROCESS_READY_FOR_CONFERENCE_STATUSES.includes(status);
}

export async function isProcessReadyForConference(demandId: string): Promise<boolean> {
  await ensureRecebimentoV2DbReady();
  const process = await recebimentoV2Db.processes.get(demandId);
  return isProcessReadyStatus(process?.status);
}

export function isPreparationRoute(pathname: string): boolean {
  return PREPARATION_ROUTE_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
}

export async function assertProcessReadyForConference(
  demandId: string,
  pathname: string,
): Promise<void> {
  if (isPreparationRoute(pathname)) {
    return;
  }

  const ready = await isProcessReadyForConference(demandId);
  if (!ready) {
    throw redirect({
      to: '/recebimento-v2/$id/preparacao',
      params: { id: demandId },
    });
  }
}
