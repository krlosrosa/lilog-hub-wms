import type { ChecklistView } from '@lilog/contracts';
import { getChecklist, getDemanda } from '@lilog/replicache-recebimento';

import { isChecklistComplete } from '@/features/recebimento-v2/lib/is-checklist-complete';
import { getActiveReplicache } from '@/lib/replicache/replicache-registry';

export { isChecklistComplete };

const MIN_SERVER_CHECKLIST_PHOTOS = 3;
const CONFERENCE_SITUACOES = new Set(['em_conferencia', 'conferido']);

export interface LocalChecklistPhotoCounts {
  lacre: number;
  bauFechado: number;
  bauAberto: number;
}

function hasLocalChecklistPhotos(counts: LocalChecklistPhotoCounts | undefined): boolean {
  return Boolean(counts?.lacre && counts?.bauFechado && counts?.bauAberto);
}

function hasServerChecklistPhotos(checklist: ChecklistView | null | undefined): boolean {
  return (checklist?.photoCount ?? 0) >= MIN_SERVER_CHECKLIST_PHOTOS;
}

export function isChecklistCompleteRc(
  checklist: ChecklistView | null | undefined,
  localPhotoCounts?: LocalChecklistPhotoCounts,
): boolean {
  return Boolean(
    checklist?.dock?.trim() &&
      checklist?.lacre?.trim() &&
      (hasLocalChecklistPhotos(localPhotoCounts) || hasServerChecklistPhotos(checklist)),
  );
}

export async function isChecklistCompleteForDemandRc(demandId: string): Promise<boolean> {
  const rep = getActiveReplicache();
  if (!rep) {
    return false;
  }

  const [checklist, demand] = await rep.query((tx) =>
    Promise.all([getChecklist(tx, demandId), getDemanda(tx, demandId)]),
  );

  if (demand?.situacao === 'impedido') {
    return false;
  }

  if (demand?.situacao && CONFERENCE_SITUACOES.has(demand.situacao)) {
    return true;
  }

  return isChecklistCompleteRc(checklist);
}

export async function isDemandImpedidaRc(demandId: string): Promise<boolean> {
  const rep = getActiveReplicache();
  if (!rep) {
    return false;
  }

  const demand = await rep.query((tx) => getDemanda(tx, demandId));
  return demand?.situacao === 'impedido';
}
