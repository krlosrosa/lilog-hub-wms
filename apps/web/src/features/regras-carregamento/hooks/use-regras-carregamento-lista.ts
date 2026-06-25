'use client';



import { useCallback } from 'react';



import { useRegrasProdutividadeListaCore } from '@/features/config-operacional/hooks/use-regras-produtividade-lista-core';

import { mapApiToRegraCarregamento } from '@/features/config-operacional/types/configuracao-operacional.api';

import { calcularTempoCarregamentoSeg } from '@/features/regras-carregamento/lib/calcular-tempo-esperado';

import {

  PREVIEW_QTD_CLIENTES,

  PREVIEW_QTD_PALETES,

  PREVIEW_QTD_TABELAS,

  type RegraCarregamento,

} from '@/features/regras-carregamento/types/regra-carregamento.schema';



export function useRegrasCarregamentoLista() {

  const lista = useRegrasProdutividadeListaCore(

    'carregamento',

    mapApiToRegraCarregamento,

  );



  const calcularPreview = useCallback((regra: RegraCarregamento) => {

    return calcularTempoCarregamentoSeg(

      regra,

      PREVIEW_QTD_PALETES,

      PREVIEW_QTD_CLIENTES,

      PREVIEW_QTD_TABELAS,

    );

  }, []);



  return {

    ...lista,

    calcularPreview,

  };

}

