import { useCallback, useEffect, useState } from 'react';

import {
  getDocumentDownloadUrl,
  getPreRecebimentoImpedimentoDetalhe,
  listImpedimentoDocumentos,
} from '@/features/gestao-recursos-recebimento/api/recebimento-impedimento-api';
import { resolveTipoImpedimentoLabel } from '@/features/gestao-recursos-recebimento/lib/impedimento-labels';
import type { ImpedimentoDetalheViewModel } from '@/features/gestao-recursos-recebimento/types/impedimento-detalhe.api';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function useImpedimentoDetalhe(preRecebimentoId: string | null, isOpen: boolean) {
  const [detalhe, setDetalhe] = useState<ImpedimentoDetalheViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!preRecebimentoId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getPreRecebimentoImpedimentoDetalhe(preRecebimentoId);
      const impedimento = response.impedimento;

      if (!impedimento) {
        setDetalhe(null);
        setError('Nenhum impedimento encontrado para esta demanda.');
        return;
      }

      const documentos = await listImpedimentoDocumentos(preRecebimentoId);
      const fotos = await Promise.all(
        documentos.map(async (documento, index) => ({
          id: documento.id,
          legenda: `Evidência ${index + 1}`,
          url: await getDocumentDownloadUrl(documento.id),
        })),
      );

      setDetalhe({
        preRecebimentoId,
        placa: response.preRecebimento.placa,
        transportadoraNome: response.preRecebimento.transportadoraNome,
        tipo: impedimento.tipo,
        tipoLabel: resolveTipoImpedimentoLabel(impedimento.tipo),
        descricao: impedimento.descricao,
        photoCount: Math.max(impedimento.photoCount, fotos.length),
        registradoPorNome: impedimento.registradoPorNome,
        registradoPorMatricula: impedimento.registradoPorMatricula,
        registradoEm: formatDateTime(impedimento.registradoEm),
        fotos,
      });
    } catch (loadError) {
      setDetalhe(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Erro ao carregar detalhes do impedimento',
      );
    } finally {
      setIsLoading(false);
    }
  }, [preRecebimentoId]);

  useEffect(() => {
    if (!isOpen || !preRecebimentoId) {
      setDetalhe(null);
      setError(null);
      return;
    }

    void load();
  }, [isOpen, preRecebimentoId, load]);

  return {
    detalhe,
    isLoading,
    error,
    reload: load,
  };
}
