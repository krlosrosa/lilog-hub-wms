import type { AvariaRegistro } from '../types/devolucao.schema';

const MOCK_AVARIAS_REGISTRADAS: AvariaRegistro[] = [
  {
    id: 'avaria-mock-001',
    quantidadeCaixa: 1,
    quantidadeUnidade: 6,
    tipo: 'embalagem',
    natureza: 'parcial',
    causa: 'transporte',
    photoCount: 3,
    replicado: false,
  },
  {
    id: 'avaria-mock-002',
    quantidadeCaixa: 0,
    quantidadeUnidade: 2,
    tipo: 'fisica',
    natureza: 'superficial',
    causa: 'manuseio',
    photoCount: 2,
    replicado: true,
  },
];

const store = new Map<string, AvariaRegistro[]>();

function cloneAvarias(avarias: AvariaRegistro[]) {
  return avarias.map((avaria) => ({ ...avaria }));
}

export function getAvariasRegistradas(demandId: string): AvariaRegistro[] {
  if (!store.has(demandId)) {
    store.set(demandId, cloneAvarias(MOCK_AVARIAS_REGISTRADAS));
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
