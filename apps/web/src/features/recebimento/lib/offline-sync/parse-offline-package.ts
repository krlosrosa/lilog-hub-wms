import {
  extractCompactQrCandidates,
  normalizeOfflineScanInput,
  tryDecodeCompactQrPayload,
} from './compact-codec';
import type {
  SyncExportEntry,
  SyncExportPackage,
  SyncExportQrChunk,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSyncExportEntry(value: unknown): value is SyncExportEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.endpoint === 'string' &&
    typeof value.method === 'string' &&
    typeof value.label === 'string' &&
    typeof value.createdAt === 'number'
  );
}

export function isSyncExportPackage(value: unknown): value is SyncExportPackage {
  if (!isRecord(value)) return false;
  return (
    typeof value.version === 'number' &&
    typeof value.exportId === 'string' &&
    Array.isArray(value.entries) &&
    value.entries.every(isSyncExportEntry)
  );
}

export function isSyncExportQrChunk(value: unknown): value is SyncExportQrChunk {
  if (!isRecord(value)) return false;
  return (
    typeof value.v === 'number' &&
    typeof value.exportId === 'string' &&
    typeof value.i === 'number' &&
    typeof value.n === 'number' &&
    Array.isArray(value.entries) &&
    value.entries.every(isSyncExportEntry)
  );
}

export function parseOfflineScan(raw: string): SyncExportPackage | SyncExportQrChunk {
  const trimmed = normalizeOfflineScanInput(raw);
  if (!trimmed) {
    throw new Error('Código vazio');
  }

  const compact = tryDecodeCompactQrPayload(trimmed);
  if (compact) {
    return compact;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(
      'Código inválido: esperado QR compacto (KLS2:) ou JSON legado',
    );
  }

  if (isSyncExportPackage(parsed) || isSyncExportQrChunk(parsed)) {
    return parsed;
  }

  throw new Error('Código inválido: formato de pacote offline não reconhecido');
}

export function assembleFromChunks(chunks: SyncExportQrChunk[]): SyncExportPackage {
  if (chunks.length === 0) {
    throw new Error('Nenhum chunk recebido');
  }

  const exportId = chunks[0]!.exportId;
  const total = chunks[0]!.n;

  if (chunks.some((chunk) => chunk.exportId !== exportId)) {
    throw new Error('Chunks de exportações diferentes foram misturados');
  }

  if (chunks.some((chunk) => chunk.n !== total)) {
    throw new Error('Chunks inconsistentes (total diferente)');
  }

  const byIndex = new Map<number, SyncExportQrChunk>();
  for (const chunk of chunks) {
    byIndex.set(chunk.i, chunk);
  }

  if (byIndex.size !== total) {
    throw new Error(`Pacote incompleto: ${byIndex.size}/${total} partes`);
  }

  const entries: SyncExportEntry[] = [];
  for (let index = 0; index < total; index += 1) {
    const chunk = byIndex.get(index);
    if (!chunk) {
      throw new Error(`Falta a parte ${index + 1} de ${total}`);
    }
    entries.push(...chunk.entries);
  }

  const first = chunks[0]!;
  return {
    version: 1,
    exportId: first.exportId,
    exportedAt: first.exportedAt,
    scope: first.scope,
    unidadeId: first.unidadeId,
    entries,
  };
}

export function mergeScanIntoPackageState(input: {
  raw: string;
  currentPackage: SyncExportPackage | null;
  chunks: SyncExportQrChunk[];
}): {
  package: SyncExportPackage | null;
  chunks: SyncExportQrChunk[];
  message: string;
} {
  const parsed = parseOfflineScan(input.raw);

  if (isSyncExportPackage(parsed)) {
    return {
      package: parsed,
      chunks: [],
      message: `Pacote completo com ${parsed.entries.length} operação(ões).`,
    };
  }

  const nextChunks = [...input.chunks];
  const existingIndex = nextChunks.findIndex(
    (chunk) => chunk.exportId === parsed.exportId && chunk.i === parsed.i,
  );

  if (existingIndex >= 0) {
    nextChunks[existingIndex] = parsed;
  } else {
    nextChunks.push(parsed);
  }

  const sameExport = nextChunks.filter(
    (chunk) => chunk.exportId === parsed.exportId,
  );

  if (sameExport.length >= parsed.n) {
    try {
      const assembled = assembleFromChunks(sameExport);
      return {
        package: assembled,
        chunks: sameExport,
        message: `Pacote montado (${assembled.entries.length} operação(ões)).`,
      };
    } catch (error) {
      return {
        package: input.currentPackage,
        chunks: sameExport,
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível montar o pacote',
      };
    }
  }

  return {
    package: input.currentPackage,
    chunks: sameExport,
    message: `Parte ${parsed.i + 1}/${parsed.n} recebida. Continue escaneando.`,
  };
}

export function mergeBulkOfflineScans(input: {
  raw: string;
  currentPackage: SyncExportPackage | null;
  chunks: SyncExportQrChunk[];
}): {
  package: SyncExportPackage | null;
  chunks: SyncExportQrChunk[];
  message: string;
  errors: string[];
} {
  const candidates = extractCompactQrCandidates(input.raw);
  if (candidates.length <= 1) {
    try {
      const result = mergeScanIntoPackageState(input);
      return { ...result, errors: [] };
    } catch (error) {
      return {
        package: input.currentPackage,
        chunks: input.chunks,
        message: '',
        errors: [
          error instanceof Error ? error.message : 'Falha ao processar código',
        ],
      };
    }
  }

  let state = {
    package: input.currentPackage,
    chunks: input.chunks,
    message: '',
  };
  const errors: string[] = [];

  for (let index = 0; index < candidates.length; index += 1) {
    try {
      const result = mergeScanIntoPackageState({
        raw: candidates[index]!,
        currentPackage: state.package,
        chunks: state.chunks,
      });
      state = {
        package: result.package ?? state.package,
        chunks: result.chunks,
        message: result.message,
      };
    } catch (error) {
      errors.push(
        `QR ${index + 1}/${candidates.length}: ${
          error instanceof Error ? error.message : 'Falha ao processar'
        }`,
      );
    }
  }

  if (state.package) {
    return {
      ...state,
      message:
        errors.length > 0
          ? `${state.message} Alguns códigos não puderam ser lidos.`
          : state.message,
      errors,
    };
  }

  if (state.chunks.length > 0) {
    const total = state.chunks[0]?.n ?? state.chunks.length;
    const received = new Set(state.chunks.map((chunk) => chunk.i));
    const missing = Array.from({ length: total }, (_, i) => i).filter(
      (i) => !received.has(i),
    );
    const missingLabel = missing.map((i) => i + 1).join(', ');

    return {
      ...state,
      message:
        errors.length > 0
          ? `Partes recebidas: ${received.size}/${total}. Falta rebipar QR(s): ${missingLabel}.`
          : state.message,
      errors,
    };
  }

  return {
    package: null,
    chunks: input.chunks,
    message: '',
    errors:
      errors.length > 0
        ? errors
        : ['Nenhum código KLS2 válido encontrado no texto'],
  };
}

function readPayloadDemandId(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  const candidates = [
    payload.demandId,
    payload.demandaId,
    payload.preRecebimentoId,
    payload.recebimentoId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

const OFFLINE_RECEBIMENTO_PLACEHOLDER = '__offline__';

export function entryBelongsToDemandIds(
  entry: Pick<SyncExportEntry, 'endpoint' | 'payload'>,
  demandIds: string[],
): boolean {
  const normalized = demandIds.map((id) => id.trim()).filter(Boolean);
  if (normalized.length === 0) return false;

  for (const demandId of normalized) {
    if (entry.endpoint.includes(demandId)) return true;
  }

  const payloadId = readPayloadDemandId(entry.payload);
  if (payloadId != null && normalized.includes(payloadId)) {
    return true;
  }

  if (entry.endpoint.includes(`/recebimentos/${OFFLINE_RECEBIMENTO_PLACEHOLDER}`)) {
    return payloadId != null && normalized.includes(payloadId);
  }

  return false;
}

export function filterPackageByDemandIds(
  pkg: SyncExportPackage,
  demandIds: string[],
): SyncExportPackage {
  return {
    ...pkg,
    entries: pkg.entries.filter((entry) =>
      entryBelongsToDemandIds(entry, demandIds),
    ),
  };
}
