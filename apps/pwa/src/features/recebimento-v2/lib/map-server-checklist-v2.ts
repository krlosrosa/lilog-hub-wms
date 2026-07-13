import { recebimentoV2Db } from '../local-db/db';
import type { ChecklistRecord } from '../local-db/schema';
import { normalizeTempBau } from './checklist-sync-payload';
import type { RecebimentoSnapshot } from '../types/recebimento-v2.schema';

type ServerChecklist = Record<string, unknown>;

const MIN_SERVER_CHECKLIST_PHOTOS = 3;

export function resolveSnapshotChecklist(
  snapshot: RecebimentoSnapshot,
): ServerChecklist | null {
  if (snapshot.checklist && typeof snapshot.checklist === 'object') {
    return snapshot.checklist;
  }

  const fromList = snapshot.checklists?.[0];
  return fromList && typeof fromList === 'object' ? fromList : null;
}

type CachedDoca = {
  id: string;
  label?: string;
  nome?: string;
  codigo?: string | null;
};

function formatCachedDocaLabel(doca: CachedDoca): string {
  const explicitLabel = doca.label?.trim();
  if (explicitLabel) return explicitLabel;

  const codigo = doca.codigo?.trim();
  const nome = doca.nome?.trim();
  if (codigo && nome) return `${codigo} — ${nome}`;
  if (codigo) return codigo;
  if (nome) return nome;
  return doca.id;
}

export async function resolveDockLabel(
  unidadeId: string,
  docaId?: string | null,
): Promise<string> {
  if (!docaId?.trim()) {
    return '';
  }

  try {
    const docasRecord = await recebimentoV2Db.docas.get(unidadeId);
    const docas = docasRecord?.docas as CachedDoca[] | undefined;
    const match = docas?.find((doca) => doca.id === docaId);
    return match ? formatCachedDocaLabel(match) : docaId;
  } catch {
    return docaId;
  }
}

function normalizeConditions(
  checklist: ServerChecklist,
): Record<string, boolean> {
  const conditions = checklist.conditions;
  if (conditions && typeof conditions === 'object') {
    return Object.fromEntries(
      Object.entries(conditions as Record<string, unknown>).map(([key, value]) => [
        key,
        Boolean(value),
      ]),
    );
  }

  return {
    limpeza: Boolean(checklist.condicaoLimpeza),
    odor: Boolean(checklist.condicaoOdor),
    estrutura: Boolean(checklist.condicaoEstrutura),
    vedacao: Boolean(checklist.condicaoVedacao),
  };
}

export function mapServerChecklistToRecord(
  checklist: ServerChecklist,
  demandId: string,
  dock: string,
  now = Date.now(),
): ChecklistRecord {
  const serverChecklistId = checklist.id ? String(checklist.id) : undefined;
  const lacre = checklist.lacre ? String(checklist.lacre).trim() : '';
  const createdAtRaw = checklist.createdAt ?? checklist.savedAt;
  const savedAt =
    createdAtRaw instanceof Date
      ? createdAtRaw.toISOString()
      : typeof createdAtRaw === 'string' && createdAtRaw.trim()
        ? createdAtRaw
        : new Date(now).toISOString();
  const serverPhotoCount = Number(checklist.photoCount ?? 0);

  return {
    demandId,
    id: serverChecklistId ?? crypto.randomUUID(),
    dock: dock.trim(),
    lacre,
    tempBau: normalizeTempBau(checklist.tempBau),
    conditions: normalizeConditions(checklist),
    observacoes:
      typeof checklist.observacoes === 'string' ? checklist.observacoes : undefined,
    responsavelId:
      checklist.responsavelId != null && Number.isFinite(Number(checklist.responsavelId))
        ? Number(checklist.responsavelId)
        : undefined,
    savedAt,
    syncStatus: 'synced',
    serverChecklistId,
    serverPhotoCount: Number.isFinite(serverPhotoCount) ? serverPhotoCount : 0,
    updatedAt: now,
  };
}

export function hasServerChecklistPhotos(
  checklist: Pick<ChecklistRecord, 'serverPhotoCount'> | null | undefined,
): boolean {
  return (checklist?.serverPhotoCount ?? 0) >= MIN_SERVER_CHECKLIST_PHOTOS;
}
