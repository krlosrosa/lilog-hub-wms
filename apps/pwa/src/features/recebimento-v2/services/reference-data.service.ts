import { fetchReferenceData } from '../api/sync-api.js';
import { recebimentoV2Db } from '../local-db/db.js';
import { normalizeParametrosConferenciaV2 } from '../lib/parametros-conferencia.js';

/**
 * Fetches docas + parametros de conferencia from the server and upserts into Dexie.
 * Used by bootstrap and by online hydration when opening a demand.
 */
export async function refreshReferenceData(unidadeId: string): Promise<void> {
  const refData = await fetchReferenceData(unidadeId);

  await recebimentoV2Db.transaction(
    'rw',
    [recebimentoV2Db.docas, recebimentoV2Db.unitConfigs],
    async () => {
      if (refData.docas) {
        await recebimentoV2Db.docas.put({
          unidadeId,
          docas: refData.docas,
          cachedAt: Date.now(),
        });
      }

      if (refData.configuracaoConferencia) {
        await recebimentoV2Db.unitConfigs.put({
          unidadeId,
          config: normalizeParametrosConferenciaV2(refData.configuracaoConferencia),
          cachedAt: Date.now(),
        });
      }
    },
  );
}
