import { db } from '@/lib/offline/db';

import {
  deserializeConferenciaContext,
  serializeConferenciaContext,
  type MappedConferenciaContext,
} from './map-conferencia-itens';

const PREFIX = 'recebimento:conferencia-context';
const CONFERIDOS_PREFIX = 'recebimento:conferidos';
const NAV_PREFIX = 'recebimento:conferencia-nav';
const SKU_SESSION_PREFIX = 'recebimento:conferencia-sku';
const ENTRY_STEP_PREFIX = 'recebimento:conferencia-entry-step';

function key(demandId: string): string {
  return `${PREFIX}:${demandId}`;
}

export function getConferenciaContextStore(
  demandId: string,
): MappedConferenciaContext | null {
  try {
    const raw = sessionStorage.getItem(key(demandId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MappedConferenciaContext & {
      conferidoSkus?: string[];
    };
    return {
      ...parsed,
      conferidoSkus: new Set(parsed.conferidoSkus ?? []),
    };
  } catch {
    return null;
  }
}

export function setConferenciaContextStore(
  demandId: string,
  context: MappedConferenciaContext,
): void {
  sessionStorage.setItem(
    key(demandId),
    JSON.stringify({
      ...context,
      conferidoSkus: [...context.conferidoSkus],
    }),
  );
}

export function updateDemandRecebimentoId(
  demandId: string,
  recebimentoId: string,
): void {
  const context = getConferenciaContextStore(demandId);
  if (!context) return;
  setConferenciaContextStore(demandId, { ...context, recebimentoId });
}

export async function saveConferenciaContextToDb(
  demandId: string,
  context: MappedConferenciaContext,
): Promise<void> {
  await db.demandContexts.put({
    demandId,
    context: serializeConferenciaContext(context),
    cachedAt: Date.now(),
  });
}

export async function loadConferenciaContextFromDb(
  demandId: string,
): Promise<MappedConferenciaContext | null> {
  const entry = await db.demandContexts.get(demandId);
  if (!entry) return null;
  return deserializeConferenciaContext(entry.context);
}

export async function ensureConferenciaContext(
  demandId: string,
): Promise<MappedConferenciaContext | null> {
  const fromSession = getConferenciaContextStore(demandId);
  if (fromSession) return fromSession;

  const fromDb = await loadConferenciaContextFromDb(demandId);
  if (!fromDb) return null;

  setConferenciaContextStore(demandId, fromDb);
  return fromDb;
}

export function clearConferenciaSessionData(demandId: string): void {
  sessionStorage.removeItem(key(demandId));
  sessionStorage.removeItem(`${CONFERIDOS_PREFIX}:${demandId}`);
  sessionStorage.removeItem(`${NAV_PREFIX}:${demandId}`);
  sessionStorage.removeItem(`${SKU_SESSION_PREFIX}:${demandId}`);
  sessionStorage.removeItem(`${ENTRY_STEP_PREFIX}:${demandId}`);
}
