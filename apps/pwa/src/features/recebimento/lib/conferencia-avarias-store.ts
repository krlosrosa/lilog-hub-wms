import type { AvariaRegistro } from '../types/recebimento.schema';

const store = new Map<string, AvariaRegistro[]>();
const seededDemands = new Set<string>();

function cloneAvarias(avarias: AvariaRegistro[]) {
  return avarias.map((avaria) => ({ ...avaria }));
}

export function getAvariasRegistradas(demandId: string): AvariaRegistro[] {
  return cloneAvarias(store.get(demandId) ?? []);
}

export function isAvariasSeeded(demandId: string): boolean {
  return seededDemands.has(demandId);
}

function dedupeAvariasById(avarias: AvariaRegistro[]): AvariaRegistro[] {
  const seen = new Set<string>();
  return avarias.filter((avaria) => {
    if (seen.has(avaria.id)) return false;
    seen.add(avaria.id);
    return true;
  });
}

export function seedAvariasRegistradas(
  demandId: string,
  records: AvariaRegistro[],
) {
  if (seededDemands.has(demandId)) return;
  store.set(demandId, dedupeAvariasById(cloneAvarias(records)));
  seededDemands.add(demandId);
}

export function addAvariaRegistrada(demandId: string, registro: AvariaRegistro) {
  const current = getAvariasRegistradas(demandId);
  if (current.some((avaria) => avaria.id === registro.id)) return;
  store.set(demandId, [...current, registro]);
}

export function removeAvariaRegistrada(demandId: string, id: string) {
  const current = getAvariasRegistradas(demandId);
  store.set(
    demandId,
    current.filter((avaria) => avaria.id !== id),
  );
}

export function createAvariaId() {
  return `avaria-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
