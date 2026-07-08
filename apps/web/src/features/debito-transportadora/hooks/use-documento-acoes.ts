'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import {
  atualizarStatusDocumentoCobranca,
  type DocumentoCobrancaStatus,
} from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import type { AcaoDocumentoConfirmacao } from '@/features/debito-transportadora/types/documento-cobranca.schema';
import { ApiClientError } from '@/lib/api';

type UseDocumentoAcoesOptions = {
  documentoId: string;
  unidadeId: string | null;
  onRefetch: () => Promise<void>;
};

const ACAO_PARA_STATUS: Record<
  AcaoDocumentoConfirmacao,
  DocumentoCobrancaStatus
> = {
  emitir: 'emitido',
  enviar: 'enviado',
  marcarPago: 'pago',
  cancelar: 'cancelado',
};

const ACAO_LABELS: Record<AcaoDocumentoConfirmacao, string> = {
  emitir: 'Documento emitido',
  enviar: 'Documento marcado como enviado',
  marcarPago: 'Documento marcado como pago',
  cancelar: 'Documento cancelado',
};

export function useDocumentoAcoes({
  documentoId,
  unidadeId,
  onRefetch,
}: UseDocumentoAcoesOptions) {
  const [processando, setProcessando] = useState(false);

  const executarAcao = useCallback(
    async (acao: AcaoDocumentoConfirmacao, observacao?: string) => {
      if (!unidadeId) {
        return;
      }

      setProcessando(true);

      try {
        await atualizarStatusDocumentoCobranca(documentoId, unidadeId, {
          status: ACAO_PARA_STATUS[acao],
          observacao,
        });

        await onRefetch();
        toast.success(ACAO_LABELS[acao]);
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Não foi possível atualizar o documento.';

        toast.error(message);
      } finally {
        setProcessando(false);
      }
    },
    [documentoId, onRefetch, unidadeId],
  );

  return {
    processando,
    executarAcao,
  };
}
