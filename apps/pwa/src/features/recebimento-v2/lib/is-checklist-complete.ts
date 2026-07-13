import { recebimentoV2Db } from '../local-db/db';
import type { ChecklistRecord } from '../local-db/schema';

import { hasServerChecklistPhotos } from './map-server-checklist-v2';

const CONFERENCE_SITUACOES = new Set(['em_conferencia', 'conferido']);

function hasLocalChecklistPhotos(
  checklist: ChecklistRecord | undefined | null,
): boolean {
  return Boolean(
    checklist?.photoMediaIds?.lacre?.length &&
      checklist.photoMediaIds?.bauFechado?.length &&
      checklist.photoMediaIds?.bauAberto?.length,
  );
}

export function isChecklistComplete(checklist: ChecklistRecord | undefined | null): boolean {
  return Boolean(
    checklist?.dock?.trim() &&
      checklist?.lacre?.trim() &&
      (hasLocalChecklistPhotos(checklist) || hasServerChecklistPhotos(checklist)),
  );
}

export async function isChecklistCompleteForDemand(demandId: string): Promise<boolean> {
  const [checklist, demand] = await Promise.all([
    recebimentoV2Db.checklists.get(demandId),
    recebimentoV2Db.demands.get(demandId),
  ]);

  if (demand?.situacao === 'impedido') {
    return false;
  }

  if (demand?.situacao && CONFERENCE_SITUACOES.has(demand.situacao)) {
    return true;
  }

  return isChecklistComplete(checklist);
}

export async function isDemandImpedida(demandId: string): Promise<boolean> {
  const demand = await recebimentoV2Db.demands.get(demandId);
  return demand?.situacao === 'impedido';
}
