'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { useUnidadeContext } from '@/contexts/unidade-context';
import { buscarDocumentoCobranca } from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import { mapDocumentoParaDetalhe } from '@/features/debito-transportadora/lib/map-documento-cobranca';
import type { DocumentoCobrancaDetalhe } from '@/features/debito-transportadora/types/documento-cobranca.schema';
import { ApiClientError } from '@/lib/api';

export function useDocumentoDetalhe(documentoId: string) {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [documento, setDocumento] = useState<DocumentoCobrancaDetalhe | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const carregarDetalhe = useCallback(async () => {
    if (!unidadeId) {
      setDocumento(null);
      setNotFound(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setNotFound(false);

    try {
      const response = await buscarDocumentoCobranca(documentoId, unidadeId);
      setDocumento(mapDocumentoParaDetalhe(response));
    } catch (error) {
      setDocumento(null);

      if (error instanceof ApiClientError && error.status === 404) {
        setNotFound(true);
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o documento de cobrança.';

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [documentoId, unidadeId]);

  useEffect(() => {
    void carregarDetalhe();
  }, [carregarDetalhe]);

  return {
    documento,
    isLoading,
    notFound,
    recarregar: carregarDetalhe,
  };
}
