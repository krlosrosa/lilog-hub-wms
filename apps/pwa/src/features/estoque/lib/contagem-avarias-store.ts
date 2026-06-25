import type { ContagemAvariaRegistro } from '../types/estoque.schema';

const store = new Map<string, ContagemAvariaRegistro[]>();
let version = 0;
const listeners = new Set<() => void>();

const EMPTY_AVARIAS: ContagemAvariaRegistro[] = [];
const EMPTY_ENDERECOS = new Set<string>();

const avariasByEnderecoCache = new Map<
  string,
  { version: number; value: ContagemAvariaRegistro[] }
>();
const enderecosComAvariaCache = new Map<string, { version: number; value: Set<string> }>();

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

export function normalizeContagemEndereco(endereco: string) {
  return endereco.trim().toUpperCase();
}

export function subscribeContagemAvarias(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getContagemAvariasVersion() {
  return version;
}

function cloneRegistros(registros: ContagemAvariaRegistro[]) {
  return registros.map((item) => ({ ...item }));
}

export function getAvariasByDemanda(demandaId: string): ContagemAvariaRegistro[] {
  return cloneRegistros(store.get(demandaId) ?? []);
}

export function getAvariasByEndereco(
  demandaId: string,
  endereco: string
): ContagemAvariaRegistro[] {
  const key = normalizeContagemEndereco(endereco);
  if (!key || key === '—') return EMPTY_AVARIAS;

  const cacheKey = `${demandaId}:${key}`;
  const cached = avariasByEnderecoCache.get(cacheKey);
  if (cached && cached.version === version) {
    return cached.value;
  }

  const filtered = getAvariasByDemanda(demandaId).filter(
    (item) => normalizeContagemEndereco(item.endereco) === key
  );
  const value = filtered.length === 0 ? EMPTY_AVARIAS : filtered;
  avariasByEnderecoCache.set(cacheKey, { version, value });
  return value;
}

export function hasAvariaNoEndereco(demandaId: string, endereco: string) {
  return getAvariasByEndereco(demandaId, endereco).length > 0;
}

export function getEnderecosComAvaria(demandaId: string): Set<string> {
  const cached = enderecosComAvariaCache.get(demandaId);
  if (cached && cached.version === version) {
    return cached.value;
  }

  const registros = getAvariasByDemanda(demandaId);
  if (registros.length === 0) {
    enderecosComAvariaCache.set(demandaId, { version, value: EMPTY_ENDERECOS });
    return EMPTY_ENDERECOS;
  }

  const value = new Set(
    registros.map((item) => normalizeContagemEndereco(item.endereco))
  );
  enderecosComAvariaCache.set(demandaId, { version, value });
  return value;
}

export function addContagemAvaria(registro: ContagemAvariaRegistro) {
  const current = getAvariasByDemanda(registro.demandaId);
  store.set(registro.demandaId, [...current, registro]);
  notify();
}

export function removeContagemAvaria(demandaId: string, id: string) {
  const current = getAvariasByDemanda(demandaId);
  store.set(
    demandaId,
    current.filter((item) => item.id !== id)
  );
  notify();
}

export function createContagemAvariaId() {
  return `contagem-avaria-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
