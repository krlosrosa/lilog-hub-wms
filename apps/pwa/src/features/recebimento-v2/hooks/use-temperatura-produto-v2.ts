import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo, useState } from 'react';

import { recebimentoV2Db } from '../local-db/db';
import type { SyncOperationRecord, TemperatureRecord } from '../local-db/schema';
import { triggerAutoSyncIfPending } from '../services/auto-sync-v2.service';
import {
  TEMPERATURA_BAU_ETAPA_LABELS,
  TEMPERATURA_BAU_ETAPAS,
  TOTAL_TEMPERATURA_BAU_ETAPAS,
  type TemperaturaEtapaV2,
} from '../lib/temperatura-bau-v2';

export type { TemperaturaEtapaV2 };

export interface TemperaturaEtapaStateV2 {
  etapa: TemperaturaEtapaV2;
  label: string;
  shortLabel: string;
  temperatura: number | null;
}

const ETAPAS: Array<{
  etapa: TemperaturaEtapaV2;
  label: string;
  shortLabel: string;
}> = TEMPERATURA_BAU_ETAPAS.map((etapa) => ({
  etapa,
  label: TEMPERATURA_BAU_ETAPA_LABELS[etapa],
  shortLabel: etapa === 'inicio' ? 'Início' : etapa === 'meio' ? 'Meio' : 'Fim',
}));

export function useTemperaturaProdutoV2(demandId: string) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const temperatures = useLiveQuery(
    () => recebimentoV2Db.temperatures.where('demandId').equals(demandId).toArray(),
    [demandId],
  );

  const etapas = useMemo((): TemperaturaEtapaStateV2[] => {
    const byEtapa = new Map(
      (temperatures ?? []).map((item) => [item.etapa, item.temperatura]),
    );
    return ETAPAS.map((item) => ({
      ...item,
      temperatura: byEtapa.get(item.etapa) ?? null,
    }));
  }, [temperatures]);

  const preenchidas = etapas.filter((item) => item.temperatura != null).length;
  const completo = preenchidas === TOTAL_TEMPERATURA_BAU_ETAPAS;

  const saveEtapas = useCallback(
    async (
      entries: Array<{ etapa: TemperaturaEtapaV2; temperatura: number }>,
    ): Promise<boolean> => {
      if (entries.length === 0) return false;

      setIsSaving(true);
      setSaveError(null);

      try {
        const existing = await recebimentoV2Db.temperatures
          .where('demandId')
          .equals(demandId)
          .toArray();
        const byEtapa = new Map(existing.map((item) => [item.etapa, item.temperatura]));

        const entriesToSave = entries.filter(
          (entry) => byEtapa.get(entry.etapa) !== entry.temperatura,
        );

        if (entriesToSave.length === 0) {
          return true;
        }

        const nowMs = Date.now();

        await recebimentoV2Db.transaction(
          'rw',
          [recebimentoV2Db.temperatures, recebimentoV2Db.syncOperations],
          async () => {
            for (const entry of entriesToSave) {
              const opId = crypto.randomUUID();
              const record: TemperatureRecord = {
                id: `${demandId}::${entry.etapa}`,
                demandId,
                etapa: entry.etapa,
                temperatura: entry.temperatura,
                syncStatus: 'pending',
                updatedAt: nowMs,
              };

              const syncOp: SyncOperationRecord = {
                id: opId,
                aggregateId: demandId,
                module: 'temperature',
                opType: RECEBIMENTO_V2_OP_TYPES.TEMPERATURA_UPSERT,
                sequence: nowMs,
                dependsOn: [],
                idempotencyKey: opId,
                payload: record,
                attachmentIds: [],
                status: 'pending',
                attempts: 0,
                createdAt: nowMs,
                updatedAt: nowMs,
              };

              await recebimentoV2Db.temperatures.put(record);
              await recebimentoV2Db.syncOperations.put(syncOp);
            }
          },
        );

        triggerAutoSyncIfPending(demandId);
        return true;
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : 'Erro ao salvar temperaturas',
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [demandId],
  );

  const saveEtapa = useCallback(
    async (etapa: TemperaturaEtapaV2, temperatura: number): Promise<boolean> =>
      saveEtapas([{ etapa, temperatura }]),
    [saveEtapas],
  );

  const clearSaveError = useCallback(() => {
    setSaveError(null);
  }, []);

  return {
    etapas,
    preenchidas,
    totalEtapas: TOTAL_TEMPERATURA_BAU_ETAPAS,
    completo,
    isLoading: temperatures === undefined,
    isSaving,
    saveError,
    saveEtapas,
    saveEtapa,
    clearSaveError,
  };
}
