import type { OutboxEntry } from '../db';
import { OFFLINE_RECEBIMENTO_PLACEHOLDER } from '@/features/recebimento/lib/recebimento-sync';

export type SyncExportModule =
  | 'recebimento'
  | 'devolucao'
  | 'estoque'
  | 'armazenagem'
  | 'outro';

export interface DemandGroupKey {
  demandId: string;
  module: SyncExportModule;
}

export interface DemandErrorGroup {
  demandId: string;
  module: SyncExportModule;
  moduleLabel: string;
  entries: OutboxEntry[];
  firstErrorAt: number;
  labelSample: string;
}

const MODULE_LABELS: Record<SyncExportModule, string> = {
  recebimento: 'Recebimento',
  devolucao: 'Devolução',
  estoque: 'Estoque',
  armazenagem: 'Armazenagem',
  outro: 'Outros',
};

const ENDPOINT_PATTERNS: Array<{
  module: SyncExportModule;
  regex: RegExp;
}> = [
  {
    module: 'recebimento',
    regex: /^\/recebimentos\/([^/?#]+)/i,
  },
  {
    module: 'devolucao',
    regex: /^\/devolucao\/demandas\/([^/?#]+)/i,
  },
  {
    module: 'estoque',
    regex: /^\/estoque\/recuperacao\/demands\/([^/?#]+)/i,
  },
  {
    module: 'armazenagem',
    regex: /^\/armazenagem\/demandas\/([^/?#]+)/i,
  },
];

function readPayloadDemandId(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const record = payload as Record<string, unknown>;
  const candidates = [record.demandId, record.demandaId, record.preRecebimentoId];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

export function extractDemandFromOutbox(entry: OutboxEntry): DemandGroupKey | null {
  const endpoint = entry.endpoint.trim();

  for (const pattern of ENDPOINT_PATTERNS) {
    const match = endpoint.match(pattern.regex);
    let demandId = match?.[1] ? decodeURIComponent(match[1]) : null;
    if (demandId) {
      if (
        pattern.module === 'recebimento' &&
        demandId === OFFLINE_RECEBIMENTO_PLACEHOLDER
      ) {
        const payloadDemandId = readPayloadDemandId(entry.payload);
        if (payloadDemandId) {
          demandId = payloadDemandId;
        }
      }

      return { demandId, module: pattern.module };
    }
  }

  const payloadDemandId = readPayloadDemandId(entry.payload);
  if (payloadDemandId) {
    return { demandId: payloadDemandId, module: 'outro' };
  }

  return null;
}

export function entryBelongsToDemand(
  entry: Pick<OutboxEntry, 'endpoint' | 'payload'>,
  demandId: string,
): boolean {
  const extracted = extractDemandFromOutbox(entry as OutboxEntry);
  if (extracted?.demandId === demandId) return true;

  const normalized = demandId.trim();
  if (!normalized) return false;

  if (entry.endpoint.includes(normalized)) return true;

  const payloadDemandId = readPayloadDemandId(entry.payload);
  return payloadDemandId === normalized;
}

export function groupOutboxErrorsByDemand(
  entries: OutboxEntry[],
): DemandErrorGroup[] {
  const groups = new Map<string, DemandErrorGroup>();

  for (const entry of entries) {
    const extracted = extractDemandFromOutbox(entry);
    const demandId = extracted?.demandId ?? 'sem-demanda';
    const module = extracted?.module ?? 'outro';
    const key = `${module}:${demandId}`;

    const existing = groups.get(key);
    if (existing) {
      existing.entries.push(entry);
      existing.firstErrorAt = Math.min(existing.firstErrorAt, entry.createdAt);
      continue;
    }

    groups.set(key, {
      demandId,
      module,
      moduleLabel: MODULE_LABELS[module],
      entries: [entry],
      firstErrorAt: entry.createdAt,
      labelSample: entry.label,
    });
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (a.demandId === 'sem-demanda' && b.demandId !== 'sem-demanda') return 1;
    if (b.demandId === 'sem-demanda' && a.demandId !== 'sem-demanda') return -1;
    return a.firstErrorAt - b.firstErrorAt;
  });
}

export function getModuleLabel(module: SyncExportModule): string {
  return MODULE_LABELS[module];
}
