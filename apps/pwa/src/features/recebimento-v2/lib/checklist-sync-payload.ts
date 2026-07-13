import type { ChecklistPhotoMediaIds } from '../local-db/schema';
import type { ChecklistFormV2 } from '../types/recebimento-v2.schema';

export function normalizeTempBau(value: unknown): number | undefined {
  if (value === '' || value == null) {
    return undefined;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function countChecklistPhotoMediaIds(
  photoMediaIds: ChecklistPhotoMediaIds | undefined,
): number {
  if (!photoMediaIds) {
    return 0;
  }

  return [
    ...(photoMediaIds.lacre ?? []),
    ...(photoMediaIds.bauFechado ?? []),
    ...(photoMediaIds.bauAberto ?? []),
    ...(photoMediaIds.extras ?? []),
  ].length;
}

export interface ChecklistSyncPayloadInput {
  demandId: string;
  dockId: string;
  form: ChecklistFormV2;
  photoMediaIds: ChecklistPhotoMediaIds;
  responsavelId?: number;
}

export function buildChecklistSyncPayload({
  demandId,
  dockId,
  form,
  photoMediaIds,
  responsavelId,
}: ChecklistSyncPayloadInput): Record<string, unknown> {
  const photoCount = countChecklistPhotoMediaIds(photoMediaIds);

  return {
    demandId,
    dockId,
    lacre: form.lacre,
    tempBau: normalizeTempBau(form.tempBau),
    conditions: form.conditions,
    observacoes: form.observacoes,
    responsavelId,
    photoCount,
    photoMediaIds,
  };
}
