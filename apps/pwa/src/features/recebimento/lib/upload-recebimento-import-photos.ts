import { getChecklistDraft } from '@/lib/offline/checklist-cache';
import type { OutboxEntry } from '@/lib/offline/db';
import { db } from '@/lib/offline/db';
import { getPhoto } from '@/lib/offline/photo-store';

import type { ChecklistPhotoSlotUpload } from './upload-checklist-photos';
import { uploadChecklistPhotos } from './upload-checklist-photos';
import { uploadAvariaPhotos } from './upload-avaria-photos';

function isChecklistEntry(entry: OutboxEntry): boolean {
  return (
    entry.method === 'PUT' &&
    entry.endpoint.toLowerCase().includes('/checklist')
  );
}

function isAvariaEntry(entry: OutboxEntry): boolean {
  return (
    entry.method === 'POST' &&
    entry.endpoint.toLowerCase().includes('/avarias')
  );
}

function resolveSlotFromRelatedId(
  relatedId: string,
  demandId: string,
): string {
  const prefix = `checklist-${demandId}-`;
  if (!relatedId.startsWith(prefix)) {
    return 'extras';
  }

  return relatedId.slice(prefix.length) || 'extras';
}

async function resolveChecklistPhotoSlots(
  demandId: string,
  photoIds: number[],
): Promise<ChecklistPhotoSlotUpload[]> {
  const draft = await getChecklistDraft(demandId);
  if (draft?.photoSlots?.some((slot) => slot.photoIds.length > 0)) {
    return draft.photoSlots;
  }

  const slots = new Map<string, number[]>();

  for (const photoId of photoIds) {
    const photo = await getPhoto(db, photoId);
    if (!photo) continue;

    const slotId = resolveSlotFromRelatedId(photo.relatedId, demandId);
    const current = slots.get(slotId) ?? [];
    current.push(photoId);
    slots.set(slotId, current);
  }

  return [...slots.entries()].map(([slotId, ids]) => ({
    slotId,
    photoIds: ids,
  }));
}

export async function uploadRecebimentoImportPhotos(input: {
  demandId: string;
  recebimentoId: string;
  entries: OutboxEntry[];
}): Promise<void> {
  const checklistEntry = input.entries.find(isChecklistEntry);
  const checklistPhotoIds = checklistEntry?.photoIds ?? [];

  if (checklistPhotoIds.length > 0) {
    const slots = await resolveChecklistPhotoSlots(
      input.demandId,
      checklistPhotoIds,
    );

    if (slots.some((slot) => slot.photoIds.length > 0)) {
      try {
        await uploadChecklistPhotos(input.recebimentoId, slots);
      } catch {
        // Não bloqueia import se upload de fotos do checklist falhar.
      }
    }
  }

  for (const entry of input.entries) {
    if (!isAvariaEntry(entry)) continue;

    const photoIds = entry.photoIds ?? [];
    if (photoIds.length === 0) continue;

    try {
      await uploadAvariaPhotos(input.recebimentoId, photoIds);
    } catch {
      // Não bloqueia import se upload de fotos de avaria falhar.
    }
  }
}
