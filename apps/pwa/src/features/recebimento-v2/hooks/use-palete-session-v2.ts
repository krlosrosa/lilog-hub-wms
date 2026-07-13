import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';

import { recebimentoV2Db } from '../local-db/db';
import { setActivePaleteV2 } from '../services/palete-session-v2.service';

export function usePaleteSessionV2(demandId: string, controlaPalete: boolean) {
  const process = useLiveQuery(
    () => recebimentoV2Db.processes.get(demandId),
    [demandId],
  );

  const activePaleteCodigo = process?.activePaleteCodigo?.trim() || null;

  const setPalete = useCallback(
    async (codigo: string) => {
      await setActivePaleteV2(demandId, codigo);
    },
    [demandId],
  );

  return useMemo(
    () => ({
      enabled: controlaPalete,
      activePaleteCodigo,
      setPalete,
    }),
    [activePaleteCodigo, controlaPalete, setPalete],
  );
}
