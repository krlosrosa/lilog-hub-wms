import { useSyncExternalStore } from 'react';

import {
  getAllDemandas,
  getDemanda,
  getExecucao,
  getItem,
  getItensByDemanda,
  getRecuperacaoVersion,
  getScanState,
  subscribeRecuperacao,
} from '../lib/recuperacao-store';

function createRecuperacaoSnapshot<T>(read: () => T): () => T {
  return () => {
    void getRecuperacaoVersion();
    return read();
  };
}

export function useRecuperacaoDemandas() {
  return useSyncExternalStore(
    subscribeRecuperacao,
    createRecuperacaoSnapshot(getAllDemandas),
    getAllDemandas,
  );
}

export function useRecuperacaoDemanda(demandaId: string) {
  const read = createRecuperacaoSnapshot(() => getDemanda(demandaId));
  return useSyncExternalStore(subscribeRecuperacao, read, read);
}

export function useRecuperacaoItens(demandaId: string) {
  const read = createRecuperacaoSnapshot(() => getItensByDemanda(demandaId));
  return useSyncExternalStore(subscribeRecuperacao, read, read);
}

export function useRecuperacaoItem(itemId: string) {
  const read = createRecuperacaoSnapshot(() => getItem(itemId));
  return useSyncExternalStore(subscribeRecuperacao, read, read);
}

export function useRecuperacaoScanState(demandaId: string, itemId: string) {
  const read = createRecuperacaoSnapshot(() =>
    getScanState(demandaId, itemId),
  );
  return useSyncExternalStore(subscribeRecuperacao, read, read);
}

export function useRecuperacaoExecucao(itemId: string) {
  const read = createRecuperacaoSnapshot(() => getExecucao(itemId));
  return useSyncExternalStore(subscribeRecuperacao, read, read);
}

export function useRecuperacaoVersion() {
  return useSyncExternalStore(
    subscribeRecuperacao,
    getRecuperacaoVersion,
    getRecuperacaoVersion,
  );
}
