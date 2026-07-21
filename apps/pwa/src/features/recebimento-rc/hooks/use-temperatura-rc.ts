import type { TemperaturaBauEtapa } from '@lilog/contracts';

import { useCallback, useMemo, useState } from 'react';



import {

  TEMPERATURA_BAU_ETAPA_LABELS,

  TEMPERATURA_BAU_ETAPAS,

  TOTAL_TEMPERATURA_BAU_ETAPAS,

} from '@/features/recebimento-v2/lib/temperatura-bau-v2';

import {

  useReplicache,

  useTemperaturasBauReplicache,

} from '@/lib/replicache/hooks';

import {

  isValidationPushError,

  parsePushErrorMessage,

} from '@/lib/replicache/parse-push-error';



import { useDemandaRc } from './use-demanda-rc';



export type TemperaturaEtapaRc = TemperaturaBauEtapa;



export interface TemperaturaEtapaStateRc {

  etapa: TemperaturaEtapaRc;

  label: string;

  shortLabel: string;

  temperatura: number | null;

}



const ETAPAS: Array<{

  etapa: TemperaturaEtapaRc;

  label: string;

  shortLabel: string;

}> = TEMPERATURA_BAU_ETAPAS.map((etapa) => ({

  etapa,

  label: TEMPERATURA_BAU_ETAPA_LABELS[etapa],

  shortLabel: etapa === 'inicio' ? 'Início' : etapa === 'meio' ? 'Meio' : 'Fim',

}));



export function useTemperaturaRc(preRecebimentoId: string) {

  const demanda = useDemandaRc(preRecebimentoId);

  const temperaturas = useTemperaturasBauReplicache(preRecebimentoId);

  const { rep, isReady } = useReplicache();

  const [isSaving, setIsSaving] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);



  const etapas = useMemo((): TemperaturaEtapaStateRc[] => {

    const byEtapa = new Map(temperaturas.map((item) => [item.etapa, item.temperatura]));

    return ETAPAS.map((item) => ({

      ...item,

      temperatura: byEtapa.get(item.etapa) ?? null,

    }));

  }, [temperaturas]);



  const preenchidas = etapas.filter((item) => item.temperatura != null).length;

  const completo = preenchidas === TOTAL_TEMPERATURA_BAU_ETAPAS;



  const saveEtapas = useCallback(

    async (

      entries: Array<{ etapa: TemperaturaEtapaRc; temperatura: number }>,

    ): Promise<boolean> => {

      if (!rep) {

        setSaveError('Replicache não está pronto');

        return false;

      }



      if (entries.length === 0) {

        return true;

      }



      setIsSaving(true);

      setSaveError(null);



      try {

        for (const entry of entries) {

          const saved = etapas.find((item) => item.etapa === entry.etapa)?.temperatura;

          if (saved === entry.temperatura) {

            continue;

          }



          await rep.mutate.upsertTemperaturaBau({

            preRecebimentoId,

            etapa: entry.etapa,

            temperatura: entry.temperatura,

          });

        }



        await rep.push({ now: true });

        return true;

      } catch (error) {

        const message = parsePushErrorMessage(error);

        if (isValidationPushError(message)) {

          setSaveError(message);

        } else {

          setSaveError(

            error instanceof Error ? error.message : 'Erro ao salvar temperaturas',

          );

        }

        return false;

      } finally {

        setIsSaving(false);

      }

    },

    [etapas, preRecebimentoId, rep],

  );



  const clearSaveError = useCallback(() => {

    setSaveError(null);

  }, []);



  return {

    etapas,

    preenchidas,

    totalEtapas: TOTAL_TEMPERATURA_BAU_ETAPAS,

    completo,

    isLoading: !isReady,

    isSaving,

    saveError,

    saveEtapas,

    clearSaveError,

    recebimentoId: demanda?.recebimentoId ?? null,

  };

}


