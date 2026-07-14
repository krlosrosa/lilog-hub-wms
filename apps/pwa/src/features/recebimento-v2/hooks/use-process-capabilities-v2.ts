import { useLiveQuery } from 'dexie-react-hooks';

import { recebimentoV2Db } from '../local-db/db';
import { deriveCapabilitiesFromProcess } from '../lib/derive-process-capabilities';

export function useProcessCapabilitiesV2(demandId: string) {
  const process = useLiveQuery(
    () => recebimentoV2Db.processes.get(demandId),
    [demandId],
  );

  const capabilities = deriveCapabilitiesFromProcess(process);
  const papelDoUsuario = process?.papelDoUsuario ?? null;
  const souApoio = process?.souApoio === true || papelDoUsuario === 'apoio';

  return {
    capabilities,
    papelDoUsuario,
    souApoio,
  };
}
