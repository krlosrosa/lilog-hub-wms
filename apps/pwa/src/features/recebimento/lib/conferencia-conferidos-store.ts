import type { ConferenciaEntryStep } from './conferencia-sku-session';
import type { DetalheItemForm, SkuItem } from '../types/recebimento.schema';

const CONFERIDOS_PREFIX = 'recebimento:conferidos';
const NAV_PREFIX = 'recebimento:conferencia-nav';

export type ConferenciaNavigation = {
  step: ConferenciaEntryStep;
  form: DetalheItemForm;
};

export type ConferidoItemRecord = {
  sku: string;
  name: string;
  hasAvaria?: boolean;
  hasDivergencia?: boolean;
  form: DetalheItemForm;
};

function conferidosKey(demandId: string): string {
  return `${CONFERIDOS_PREFIX}:${demandId}`;
}

function navKey(demandId: string): string {
  return `${NAV_PREFIX}:${demandId}`;
}

function readConferidos(demandId: string): ConferidoItemRecord[] {
  try {
    const raw = sessionStorage.getItem(conferidosKey(demandId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConferidoItemRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeConferidos(demandId: string, records: ConferidoItemRecord[]): void {
  sessionStorage.setItem(conferidosKey(demandId), JSON.stringify(records));
}

export function getConferidosForDemand(demandId: string): SkuItem[] {
  return readConferidos(demandId).map((record) => ({
    sku: record.sku,
    name: record.name,
    status: 'conferido' as const,
    hasAvaria: record.hasAvaria,
    hasDivergencia: record.hasDivergencia,
  }));
}

export function getConferenciaSnapshot(
  demandId: string,
  sku: string
): DetalheItemForm | null {
  const record = readConferidos(demandId).find(
    (item) => item.sku.toLowerCase() === sku.trim().toLowerCase()
  );
  return record?.form ?? null;
}

export function saveConferidoItem(
  demandId: string,
  record: ConferidoItemRecord
): void {
  const list = readConferidos(demandId);
  const normalizedSku = record.sku.trim();
  const index = list.findIndex(
    (item) => item.sku.toLowerCase() === normalizedSku.toLowerCase()
  );
  const next = [...list];
  if (index >= 0) {
    next[index] = record;
  } else {
    next.push(record);
  }
  writeConferidos(demandId, next);
}

export function setConferenciaNavigation(
  demandId: string,
  navigation: ConferenciaNavigation
): void {
  sessionStorage.setItem(navKey(demandId), JSON.stringify(navigation));
}

export function peekConferenciaNavigation(demandId: string): ConferenciaNavigation | null {
  const raw = sessionStorage.getItem(navKey(demandId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConferenciaNavigation;
  } catch {
    return null;
  }
}

export function clearConferenciaNavigation(demandId: string): void {
  sessionStorage.removeItem(navKey(demandId));
}
