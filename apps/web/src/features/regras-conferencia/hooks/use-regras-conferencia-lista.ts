'use client';



import { useCallback } from 'react';



import { useRegrasProdutividadeListaCore } from '@/features/config-operacional/hooks/use-regras-produtividade-lista-core';

import { mapApiToRegraConferencia } from '@/features/config-operacional/types/configuracao-operacional.api';

import { calcularTempoConferenciaSeg } from '@/features/regras-conferencia/lib/calcular-tempo-esperado';

import {

  PREVIEW_QTD_CLIENTES,

  PREVIEW_QTD_LINHAS,

  PREVIEW_QTD_PALETES,

  type RegraConferencia,

} from '@/features/regras-conferencia/types/regra-conferencia.schema';



export function useRegrasConferenciaLista() {

  const lista = useRegrasProdutividadeListaCore(

    'conferencia',

    mapApiToRegraConferencia,

  );



  const calcularPreview = useCallback((regra: RegraConferencia) => {

    return calcularTempoConferenciaSeg(

      regra,

      PREVIEW_QTD_LINHAS,

      PREVIEW_QTD_PALETES,

      PREVIEW_QTD_CLIENTES,

    );

  }, []);



  return {

    ...lista,

    calcularPreview,

  };

}

