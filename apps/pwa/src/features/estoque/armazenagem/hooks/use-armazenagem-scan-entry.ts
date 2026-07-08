import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

import { useUnidade } from '@/features/unidade/lib/unidade-context';
import { hapticMedium } from '@/lib/haptics';

import { buscarTarefaArmazenagemPorEtiqueta } from '../lib/armazenagem-api';

export function useArmazenagemScanEntry() {
  const navigate = useNavigate();
  const { unidadeSelecionada } = useUnidade();
  const unidadeId = unidadeSelecionada?.id ?? null;

  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolverEtiqueta = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed || !unidadeId) return;

      setIsSubmitting(true);
      setError(null);
      hapticMedium();

      try {
        const result = await buscarTarefaArmazenagemPorEtiqueta(unidadeId, trimmed);

        void navigate({
          to: '/movimentacao/armazenagem/$id',
          params: { id: result.demandaId },
          search: {
            tarefaId: result.tarefaId,
            etiqueta: result.unitizadorCodigo,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Etiqueta não encontrada');
        setCodigo('');
      } finally {
        setIsSubmitting(false);
      }
    },
    [navigate, unidadeId],
  );

  const onSubmit = useCallback(() => {
    void resolverEtiqueta(codigo);
  }, [codigo, resolverEtiqueta]);

  const onScan = useCallback(
    (value: string) => {
      setCodigo(value);
      void resolverEtiqueta(value);
    },
    [resolverEtiqueta],
  );

  return {
    state: {
      codigo,
      error,
      isSubmitting,
      unidadeDisponivel: Boolean(unidadeId),
    },
    actions: {
      setCodigo,
      onSubmit,
      onScan,
    },
  };
}
