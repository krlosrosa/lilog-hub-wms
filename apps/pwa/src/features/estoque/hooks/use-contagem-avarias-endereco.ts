import { useCallback, useSyncExternalStore } from 'react';

import { getContagemAvariaMotivoLabel } from '../lib/avaria-labels';
import {
  getAvariasByEndereco,
  getContagemAvariasVersion,
  getEnderecosComAvaria,
  removeContagemAvaria,
  subscribeContagemAvarias,
} from '../lib/contagem-avarias-store';

export function useContagemAvariasEndereco(demandaId: string, endereco: string) {
  const avarias = useSyncExternalStore(
    subscribeContagemAvarias,
    () => {
      void getContagemAvariasVersion();
      return getAvariasByEndereco(demandaId, endereco);
    },
    () => getAvariasByEndereco(demandaId, endereco)
  );

  const removeAvaria = useCallback(
    (id: string) => {
      const confirmed = window.confirm(
        'Excluir o registro de avaria deste endereço? Esta ação não pode ser desfeita.'
      );
      if (!confirmed) return;
      removeContagemAvaria(demandaId, id);
    },
    [demandaId]
  );

  return {
    avarias,
    hasAvaria: avarias.length > 0,
    removeAvaria,
    getMotivoLabel: getContagemAvariaMotivoLabel,
  };
}

export function useContagemEnderecosComAvaria(demandaId: string) {
  return useSyncExternalStore(
    subscribeContagemAvarias,
    () => {
      void getContagemAvariasVersion();
      return getEnderecosComAvaria(demandaId);
    },
    () => getEnderecosComAvaria(demandaId)
  );
}
