import type { SessaoApi } from '@/features/gestao-recursos/types/gestao-recursos.api';

function normalizeArea(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function getSessaoAreaHints(sessao: SessaoApi): string[] {
  return [sessao.equipeArea, sessao.equipeNome, sessao.escalaNome].filter(
    (hint): hint is string => Boolean(hint?.trim()),
  );
}

export function matchesEquipeArea(
  sessao: SessaoApi,
  targetArea: string,
): boolean {
  const normalizedTarget = normalizeArea(targetArea);

  return getSessaoAreaHints(sessao).some((hint) => {
    const normalizedHint = normalizeArea(hint);
    return (
      normalizedHint.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedHint)
    );
  });
}

export function filterSessoesPorArea(
  sessoes: SessaoApi[],
  targetArea?: string,
): SessaoApi[] {
  if (!targetArea) {
    return sessoes;
  }

  const matched = sessoes.filter((sessao) =>
    matchesEquipeArea(sessao, targetArea),
  );

  return matched.length > 0 ? matched : sessoes;
}

function readStoredSessaoId(storageKey: string | null): string | null {
  if (!storageKey || typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function writeStoredSessaoId(
  storageKey: string | null,
  sessaoId: string,
): void {
  if (!storageKey || typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, sessaoId);
  } catch {
    // ignore quota / private mode
  }
}

export function buildSessaoAtivaStorageKey(
  baseKey: string | undefined,
  unidadeId: string | null,
): string | null {
  if (!baseKey || !unidadeId) {
    return null;
  }

  return `${baseKey}:${unidadeId}`;
}

export function resolveSessaoAtivaDefault(
  allSessoes: SessaoApi[],
  current: SessaoApi | null,
  options: {
    preferArea?: string;
    storageKey?: string | null;
  },
): SessaoApi | null {
  if (allSessoes.length === 0) {
    return null;
  }

  const preferred = options.preferArea
    ? allSessoes.filter((sessao) =>
        matchesEquipeArea(sessao, options.preferArea!),
      )
    : [];
  const candidates = preferred.length > 0 ? preferred : allSessoes;

  if (current && allSessoes.some((sessao) => sessao.id === current.id)) {
    return current;
  }

  const storedId = readStoredSessaoId(options.storageKey ?? null);
  if (storedId) {
    const stored = allSessoes.find((sessao) => sessao.id === storedId);
    if (stored) {
      return stored;
    }
  }

  return candidates[0] ?? null;
}
