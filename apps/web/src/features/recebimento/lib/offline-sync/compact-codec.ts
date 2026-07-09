import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

import type {
  SyncExportEntry,
  SyncExportPackage,
  SyncExportPhotoRef,
  SyncExportQrChunk,
  SyncExportScope,
} from './types';
import { SYNC_EXPORT_VERSION } from './types';

export const COMPACT_QR_PREFIX = 'KLS2:';

type CompactPhotoRef = {
  i: number;
  o: number;
  f: string;
  t: string;
  r: string;
};

type CompactEntry = {
  o: number;
  l: string;
  e: string;
  m: string;
  p: unknown;
  pi: number[];
  pr: CompactPhotoRef[];
  em?: string;
  r: number;
  c: number;
  s: SyncExportEntry['status'];
};

type CompactPackage = {
  v: number;
  id: string;
  at: string;
  sc: SyncExportScope;
  u?: string;
  en: CompactEntry[];
};

type CompactChunk = CompactPackage & {
  i: number;
  n: number;
};

function fromCompactPhotoRef(photo: CompactPhotoRef): SyncExportPhotoRef {
  return {
    photoId: photo.i,
    outboxId: photo.o,
    filename: photo.f,
    mimeType: photo.t,
    relatedId: photo.r,
  };
}

function fromCompactEntry(entry: CompactEntry): SyncExportEntry {
  return {
    outboxId: entry.o,
    label: entry.l,
    endpoint: entry.e,
    method: entry.m,
    payload: entry.p,
    photoIds: entry.pi ?? [],
    photoRefs: (entry.pr ?? []).map(fromCompactPhotoRef),
    errorMessage: entry.em,
    retries: entry.r,
    createdAt: entry.c,
    status: entry.s,
  };
}

function fromCompactPackage(pkg: CompactPackage): SyncExportPackage {
  return {
    version: SYNC_EXPORT_VERSION,
    exportId: pkg.id,
    exportedAt: pkg.at,
    scope: pkg.sc,
    unidadeId: pkg.u,
    entries: (pkg.en ?? []).map(fromCompactEntry),
  };
}

function fromCompactChunk(chunk: CompactChunk): SyncExportQrChunk {
  return {
    v: SYNC_EXPORT_VERSION,
    exportId: chunk.id,
    exportedAt: chunk.at,
    scope: chunk.sc,
    unidadeId: chunk.u,
    i: chunk.i,
    n: chunk.n,
    entries: (chunk.en ?? []).map(fromCompactEntry),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCompactPackage(value: unknown): value is CompactPackage {
  return (
    isRecord(value) &&
    typeof value.v === 'number' &&
    typeof value.id === 'string' &&
    Array.isArray(value.en) &&
    typeof value.i !== 'number'
  );
}

function isCompactChunk(value: unknown): value is CompactChunk {
  return (
    isRecord(value) &&
    typeof value.v === 'number' &&
    typeof value.id === 'string' &&
    typeof value.i === 'number' &&
    typeof value.n === 'number' &&
    Array.isArray(value.en)
  );
}

export function tryDecodeCompactQrPayload(
  raw: string,
): SyncExportPackage | SyncExportQrChunk | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith(COMPACT_QR_PREFIX)) {
    return null;
  }

  const encoded = trimmed.slice(COMPACT_QR_PREFIX.length);
  const json = decompressFromEncodedURIComponent(encoded);

  if (!json) {
    throw new Error('Falha ao descompactar QR compacto');
  }

  const parsed: unknown = JSON.parse(json);

  if (isCompactChunk(parsed)) {
    return fromCompactChunk(parsed);
  }

  if (isCompactPackage(parsed)) {
    return fromCompactPackage(parsed);
  }

  throw new Error('Formato compacto inválido');
}

/** Mantido para testes/utilitários locais. */
export function encodeCompactQrPayload(data: unknown): string {
  return `${COMPACT_QR_PREFIX}${compressToEncodedURIComponent(JSON.stringify(data))}`;
}
