import type { DocaApi } from '@/features/recebimento/types/recebimento.api';
import type { ChecklistForm } from '@/features/recebimento/types/recebimento.schema';

import type { ChecklistDraftEntry, ChecklistPhotoSlotDraft } from './db';
import { db } from './db';

export async function saveUnitDocasToDb(
  unidadeId: string,
  docas: DocaApi[],
): Promise<void> {
  await db.unitDocas.put({
    unidadeId,
    docas,
    cachedAt: Date.now(),
  });
}

export async function loadUnitDocasFromDb(
  unidadeId: string,
): Promise<DocaApi[]> {
  const entry = await db.unitDocas.get(unidadeId);
  return entry?.docas ?? [];
}

export function docasToOptions(docas: DocaApi[]) {
  return docas.map((doca) => ({
    value: doca.id,
    label: `${doca.codigo} — ${doca.nome}`,
  }));
}

export async function saveChecklistDraft(
  draft: Omit<ChecklistDraftEntry, 'createdAt'>,
): Promise<void> {
  await db.checklistDrafts.put({
    ...draft,
    createdAt: Date.now(),
  });
}

export async function getChecklistDraft(
  demandId: string,
): Promise<ChecklistDraftEntry | undefined> {
  return db.checklistDrafts.get(demandId);
}

export async function deleteChecklistDraft(demandId: string): Promise<void> {
  await db.checklistDrafts.delete(demandId);
}

export type SaveOfflineChecklistInput = {
  demandId: string;
  form: ChecklistForm;
  dockId: string;
  dockLabel: string;
  photoSlots: ChecklistPhotoSlotDraft[];
  situacao: string;
  recebimentoId: string | null;
  responsavelId: number | null;
  unidadeId: string;
};

export async function saveOfflineChecklistDraft(
  input: SaveOfflineChecklistInput,
): Promise<void> {
  await saveChecklistDraft(input);
}
