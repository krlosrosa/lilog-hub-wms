import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import type { ParametrosRecebimentoConferencia } from '@/features/recebimento/types/recebimento.schema';

import { recebimentoV2Db } from '../local-db/db';
import { normalizeParametrosConferenciaV2 } from '../lib/parametros-conferencia';

export function useParametrosConferenciaV2(
  unidadeId: string | undefined,
): ParametrosRecebimentoConferencia {
  const config = useLiveQuery(
    () => (unidadeId ? recebimentoV2Db.unitConfigs.get(unidadeId) : undefined),
    [unidadeId],
  );

  return useMemo(
    () => normalizeParametrosConferenciaV2(config?.config),
    [config],
  );
}
