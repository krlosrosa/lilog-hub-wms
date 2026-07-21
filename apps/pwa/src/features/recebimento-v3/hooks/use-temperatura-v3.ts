import { useCallback, useMemo, useState } from 'react';

import { useConferenceExecutorV3 } from '../context/conference-executor.context';
import type { TemperaturaEtapaV2 } from '@/features/recebimento-v2/hooks/use-temperatura-produto-v2';
import {
  TEMPERATURA_BAU_ETAPA_LABELS,
  TEMPERATURA_BAU_ETAPAS,
  TOTAL_TEMPERATURA_BAU_ETAPAS,
} from '@/features/recebimento-v2/lib/temperatura-bau-v2';
import { recebimentoV2Db } from '@/features/recebimento-v2/local-db/db';
import { useLiveQuery } from 'dexie-react-hooks';

const ETAPAS = TEMPERATURA_BAU_ETAPAS.map((etapa) => ({
  etapa,
  label: TEMPERATURA_BAU_ETAPA_LABELS[etapa],
  shortLabel: etapa === 'inicio' ? 'Início' : etapa === 'meio' ? 'Meio' : 'Fim',
}));

export function useTemperaturaProdutoV3(demandId: string) {
  const { executor } = useConferenceExecutorV3();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const temperatures = useLiveQuery(
    () => recebimentoV2Db.temperatures.where('demandId').equals(demandId).toArray(),
    [demandId],
  );

  const etapas = useMemo(() => {
    const byEtapa = new Map((temperatures ?? []).map((item) => [item.etapa, item.temperatura]));
    return ETAPAS.map((item) => ({
      ...item,
      temperatura: byEtapa.get(item.etapa) ?? null,
    }));
  }, [temperatures]);

  const preenchidas = etapas.filter((item) => item.temperatura != null).length;
  const completo = preenchidas === TOTAL_TEMPERATURA_BAU_ETAPAS;

  const saveEtapas = useCallback(
    async (entries: Array<{ etapa: TemperaturaEtapaV2; temperatura: number }>) => {
      if (entries.length === 0) return true;

      setIsSaving(true);
      setSaveError(null);

      try {
        await executor.registrarTemperatura(demandId, entries);
        return true;
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Erro ao salvar temperatura');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [demandId, executor],
  );

  return {
    etapas,
    preenchidas,
    totalEtapas: TOTAL_TEMPERATURA_BAU_ETAPAS,
    completo,
    saveEtapas,
    isSaving,
    saveError,
  };
}
