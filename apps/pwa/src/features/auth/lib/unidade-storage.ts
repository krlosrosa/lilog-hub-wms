import type { UnidadeOption } from '@/features/unidade/types';

const UNIDADE_STORAGE_KEY = 'lilog:pwa:unidade';

function isValidUnidade(value: unknown): value is UnidadeOption {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as UnidadeOption;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.nome === 'string' &&
    typeof candidate.nomeFilial === 'string' &&
    typeof candidate.cluster === 'string'
  );
}

export function readPersistedUnidade(): UnidadeOption | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(UNIDADE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidUnidade(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function persistUnidade(unidade: UnidadeOption | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!unidade) {
    window.localStorage.removeItem(UNIDADE_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(UNIDADE_STORAGE_KEY, JSON.stringify(unidade));
}

/** @deprecated use readPersistedUnidade */
export function readPersistedUnidadeId(): string | null {
  return readPersistedUnidade()?.id ?? null;
}

/** @deprecated use persistUnidade */
export function persistUnidadeId(unidadeId: string | null) {
  if (!unidadeId) {
    persistUnidade(null);
    return;
  }

  const current = readPersistedUnidade();
  if (current?.id === unidadeId) {
    return;
  }

  persistUnidade({
    id: unidadeId,
    nome: unidadeId,
    nomeFilial: unidadeId,
    cluster: 'CD-Fabrica',
  });
}
