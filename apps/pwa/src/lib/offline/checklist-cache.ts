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

export type DockOption = { value: string; label: string };

export function docasToOptions(docas: DocaApi[]): DockOption[] {
  return docas.map((doca) => ({
    value: doca.id,
    label: `${doca.codigo} — ${doca.nome}`,
  }));
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function extractDockCodigo(dock: string | null | undefined): string | null {
  if (!dock) return null;

  const trimmed = dock.trim();
  if (!trimmed || trimmed === '—') return null;

  if (UUID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const docaMatch = trimmed.match(/^doca\s+(.+)$/i);
  if (docaMatch) {
    return docaMatch[1]?.trim() ?? null;
  }

  return trimmed;
}

function formatDockShortLabel(label: string): string {
  const codigo = label.split(' — ')[0]?.trim();
  return codigo || label;
}

export function resolveDockDisplayLabel(
  dockRef: string | null | undefined,
  options: DockOption[],
): string {
  if (!dockRef?.trim()) return '—';

  const trimmed = dockRef.trim();

  const byValue = options.find((option) => option.value === trimmed);
  if (byValue) return formatDockShortLabel(byValue.label);

  const byLabel = options.find((option) => option.label === trimmed);
  if (byLabel) return formatDockShortLabel(byLabel.label);

  const resolvedValue = findDockOptionValue(trimmed, options);
  if (resolvedValue) {
    const option = options.find((item) => item.value === resolvedValue);
    if (option) return formatDockShortLabel(option.label);
  }

  if (UUID_PATTERN.test(trimmed)) {
    return '—';
  }

  return trimmed.replace(/^doca\s+/i, '').trim() || trimmed;
}

export function findDockOptionValue(
  dockRef: string | null | undefined,
  options: DockOption[],
): string | null {
  if (!dockRef || options.length === 0) return null;

  const codigo = extractDockCodigo(dockRef);
  if (!codigo) return null;

  const byValue = options.find((option) => option.value === codigo);
  if (byValue) return byValue.value;

  const normalizedCodigo = codigo.toLowerCase();

  const byLabelPrefix = options.find((option) => {
    const labelCodigo = option.label.split(' — ')[0]?.trim().toLowerCase();
    return labelCodigo === normalizedCodigo;
  });
  if (byLabelPrefix) return byLabelPrefix.value;

  const byLabelIncludes = options.find((option) =>
    option.label.toLowerCase().includes(normalizedCodigo),
  );
  if (byLabelIncludes) return byLabelIncludes.value;

  return null;
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
