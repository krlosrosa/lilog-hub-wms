'use client';



import { useCallback } from 'react';



import { useRegrasProdutividadeListaCore } from '@/features/config-operacional/hooks/use-regras-produtividade-lista-core';

import { mapApiToRegraExpedicao } from '@/features/config-operacional/types/configuracao-operacional.api';

import { calcularTempoEsperadoFromCounts } from '@/features/regras-expedicao/lib/calcular-tempo-esperado';

import {

  PREVIEW_QTD_ENDERECOS,

  PREVIEW_QTD_ITENS,

  PREVIEW_QTD_ITENS_SEM_ENDERECO,

  type RegraExpedicao,

} from '@/features/regras-expedicao/types/regra-expedicao.schema';



export function useRegrasExpedicaoLista() {

  const lista = useRegrasProdutividadeListaCore(

    'separacao',

    mapApiToRegraExpedicao,

  );



  const calcularPreview = useCallback((regra: RegraExpedicao) => {

    return calcularTempoEsperadoFromCounts(

      regra,

      PREVIEW_QTD_ITENS,

      PREVIEW_QTD_ENDERECOS,

      PREVIEW_QTD_ITENS_SEM_ENDERECO,

    );

  }, []);



  return {

    ...lista,

    calcularPreview,

  };

}

