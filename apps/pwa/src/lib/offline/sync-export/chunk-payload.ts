import {
  encodeCompactQrPayload,
  measureCompactPayloadSize,
  toCompactChunk,
  toCompactPackage,
} from './compact-codec';
import {
  MAX_QR_PAYLOAD_CHARS,
  type SyncExportEntry,
  type SyncExportPackage,
} from './types';

/**
 * Quebra o pacote em QRs compactos (KLS2: + LZ).
 * Se uma única entry ainda estourar o limite, ela vai sozinha mesmo assim
 * (melhor tentar ler do que perder o dado).
 */
export function chunkExportForQr(pkg: SyncExportPackage): string[] {
  const fullCompact = encodeCompactQrPayload(toCompactPackage(pkg));
  if (fullCompact.length <= MAX_QR_PAYLOAD_CHARS) {
    return [fullCompact];
  }

  const entryGroups: SyncExportEntry[][] = [];
  let currentGroup: SyncExportEntry[] = [];

  for (const entry of pkg.entries) {
    const trialSize = measureCompactPayloadSize(
      toCompactChunk(pkg, [...currentGroup, entry], 0, 1),
    );

    if (trialSize > MAX_QR_PAYLOAD_CHARS && currentGroup.length > 0) {
      entryGroups.push(currentGroup);
      currentGroup = [entry];
      continue;
    }

    currentGroup.push(entry);
  }

  if (currentGroup.length > 0) {
    entryGroups.push(currentGroup);
  }

  // Fallback: se não houver entries, ainda devolve o pacote compacto.
  if (entryGroups.length === 0) {
    return [fullCompact];
  }

  const chunkTotal = entryGroups.length;

  return entryGroups.map((entries, index) =>
    encodeCompactQrPayload(toCompactChunk(pkg, entries, index, chunkTotal)),
  );
}
