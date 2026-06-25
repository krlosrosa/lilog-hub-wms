const STORAGE_PREFIX = 'recebimento:conferencia-sku';
const ENTRY_STEP_PREFIX = 'recebimento:conferencia-entry-step';

function storageKey(demandId: string): string {
  return `${STORAGE_PREFIX}:${demandId}`;
}

function entryStepKey(demandId: string): string {
  return `${ENTRY_STEP_PREFIX}:${demandId}`;
}

export type ConferenciaEntryStep = 1 | 2 | 3;

export function setConferenciaSkuSession(demandId: string, sku: string): void {
  sessionStorage.setItem(storageKey(demandId), sku.trim());
}

export function getConferenciaSkuSession(demandId: string): string | null {
  const sku = sessionStorage.getItem(storageKey(demandId));
  return sku?.trim() ? sku : null;
}

export function clearConferenciaSkuSession(demandId: string): void {
  sessionStorage.removeItem(storageKey(demandId));
}

export function setConferenciaEntryStep(demandId: string, step: ConferenciaEntryStep): void {
  sessionStorage.setItem(entryStepKey(demandId), String(step));
}

export function peekConferenciaEntryStep(demandId: string): ConferenciaEntryStep {
  const raw = sessionStorage.getItem(entryStepKey(demandId));
  const step = Number(raw);
  if (step === 2 || step === 3) return step;
  return 1;
}

export function consumeConferenciaEntryStep(demandId: string): void {
  sessionStorage.removeItem(entryStepKey(demandId));
}
