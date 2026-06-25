'use client';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { listarConfiguracoesOperacionais } from '@/features/config-operacional/lib/configuracao-operacional-api';
import {
  mapRegrasPausaPadraoFromItems,
  PAUSAS_CATEGORIA,
  PAUSAS_DOMINIO,
  type RegrasPausaPadraoMap,
} from '@/features/config-operacional/types/configuracao-operacional.api';
import { useCallback, useEffect, useState } from 'react';

const EMPTY_REGRAS: RegrasPausaPadraoMap = {};

export function useRegrasPausaPadrao() {
  const { unidadeSelecionada, isResolved } = useUnidadeContext();
  const [regras, setRegras] = useState<RegrasPausaPadraoMap>(EMPTY_REGRAS);
  const [isLoading, setIsLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!unidadeSelecionada) {
      setRegras(EMPTY_REGRAS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await listarConfiguracoesOperacionais({
        unidadeId: unidadeSelecionada.id,
        dominio: PAUSAS_DOMINIO,
        categoria: PAUSAS_CATEGORIA,
        ativo: true,
      });

      setRegras(mapRegrasPausaPadraoFromItems(response.items));
    } catch {
      setRegras(EMPTY_REGRAS);
    } finally {
      setIsLoading(false);
    }
  }, [unidadeSelecionada]);

  useEffect(() => {
    if (!isResolved) return;
    void carregar();
  }, [carregar, isResolved]);

  return { regras, isLoading, refetch: carregar };
}
