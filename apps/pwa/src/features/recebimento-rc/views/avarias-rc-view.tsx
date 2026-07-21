import { AvariasV2ViewContent } from '@/features/recebimento-v2/views/avarias-v2-view';

import {

  normalizeSkuParam,

  resolveUnidadesPorCaixa,

} from '@/features/recebimento-v2/lib/resolve-produto-conferencia-v2';

import { useCallback } from 'react';



import { useAvariaRc } from '../hooks/use-avaria-rc';

import { useConferenciaRc } from '../hooks/use-conferencia-rc';

import { useProcessLikeRc } from '../hooks/use-demanda-rc';

import { useParametrosConferenciaRc } from '../hooks/use-parametros-conferencia-rc';



interface AvariasRcViewProps {

  demandId: string;

  sku?: string;

}



export function AvariasRcView({ demandId, sku }: AvariasRcViewProps) {

  const process = useProcessLikeRc(demandId);

  const parametrosConferencia = useParametrosConferenciaRc(process?.unidadeId);

  const { conferences, expectedItems } = useConferenciaRc(demandId);

  const avariaApi = useAvariaRc(demandId);



  const unidadesPorCaixaResolver = useCallback(

    (activeSku: string) => {

      const normalized = normalizeSkuParam(activeSku).toUpperCase();

      const expectedItem = expectedItems.find(

        (item) => normalizeSkuParam(item.sku).toUpperCase() === normalized,

      );

      return resolveUnidadesPorCaixa(expectedItem?.unidadesPorCaixa);

    },

    [expectedItems],

  );



  return (
    <AvariasV2ViewContent
      demandId={demandId}
      sku={sku}
      avariaApi={avariaApi}
      conferencesOverride={conferences}
      parametrosConferenciaOverride={parametrosConferencia}
      backTo={{ to: '/recebimento-rc/$id/itens', params: { id: demandId } }}
      unidadesPorCaixaResolver={unidadesPorCaixaResolver}
    />
  );

}

