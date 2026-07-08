import type { AvariaRegistro } from '../types/devolucao.schema';

const store = new Map<string, AvariaRegistro[]>();

function cloneAvarias(avarias: AvariaRegistro[]) {
  return avarias.map((avaria) => ({ ...avaria }));
}

export function getAvariasRegistradas(demandId: string): AvariaRegistro[] {
  if (!store.has(demandId)) {
    store.set(demandId, []);
  }
  return cloneAvarias(store.get(demandId)!);
}

export function addAvariaRegistrada(demandId: string, registro: AvariaRegistro) {
  const current = getAvariasRegistradas(demandId);
  store.set(demandId, [...current, registro]);
}

export function removeAvariaRegistrada(demandId: string, id: string) {
  const current = getAvariasRegistradas(demandId);
  store.set(
    demandId,
    current.filter((avaria) => avaria.id !== id)
  );
}

export function createAvariaId() {
  return `avaria-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
