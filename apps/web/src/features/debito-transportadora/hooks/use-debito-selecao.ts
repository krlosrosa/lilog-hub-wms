'use client';

import { useCallback, useMemo, useState } from 'react';

import { toast } from 'sonner';

import type { DebitoOcorrencia } from '@/features/debito-transportadora/types/debito.schema';

type UseDebitoSelecaoOptions = {
  ocorrencias: DebitoOcorrencia[];
};

function chaveTransportadora(item: DebitoOcorrencia) {
  return item.transportadoraId ?? item.transportadora;
}

export function useDebitoSelecao({ ocorrencias }: UseDebitoSelecaoOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const ocorrenciasPorId = useMemo(
    () => new Map(ocorrencias.map((item) => [item.id, item])),
    [ocorrencias],
  );

  const selecionados = useMemo(
    () =>
      [...selectedIds]
        .map((id) => ocorrenciasPorId.get(id))
        .filter((item): item is DebitoOcorrencia => item !== undefined),
    [ocorrenciasPorId, selectedIds],
  );

  const transportadoraSelecionada = selecionados[0]?.transportadora ?? null;
  const transportadoraIdSelecionada =
    selecionados[0]?.transportadoraId ?? null;

  const valorTotalSelecionado = selecionados.reduce(
    (acc, item) => acc + item.valor,
    0,
  );

  const podeSelecionar = useCallback(
    (item: DebitoOcorrencia) => item.status === 'aprovado',
    [],
  );

  const toggleSelect = useCallback(
    (item: DebitoOcorrencia) => {
      if (!podeSelecionar(item)) {
        return;
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (next.has(item.id)) {
          next.delete(item.id);
          return next;
        }

        const atuais = [...prev]
          .map((id) => ocorrenciasPorId.get(id))
          .filter((entry): entry is DebitoOcorrencia => entry !== undefined);

        if (atuais.length > 0) {
          const chaveAtual = chaveTransportadora(atuais[0]!);
          const chaveNova = chaveTransportadora(item);

          if (chaveAtual !== chaveNova) {
            toast.warning(
              'Selecione ocorrências da mesma transportadora para gerar um documento.',
            );
            return prev;
          }
        }

        next.add(item.id);
        return next;
      });
    },
    [ocorrenciasPorId, podeSelecionar],
  );

  const toggleSelectAll = useCallback(
    (itemsPagina: DebitoOcorrencia[]) => {
      const elegiveis = itemsPagina.filter(podeSelecionar);

      if (elegiveis.length === 0) {
        return;
      }

      setSelectedIds((prev) => {
        const transportadoras = new Set(elegiveis.map(chaveTransportadora));

        if (transportadoras.size > 1) {
          toast.warning(
            'Esta página contém transportadoras diferentes. Selecione uma por vez.',
          );
          return prev;
        }

        const chavePagina = chaveTransportadora(elegiveis[0]!);

        const atuais = [...prev]
          .map((id) => ocorrenciasPorId.get(id))
          .filter((entry): entry is DebitoOcorrencia => entry !== undefined);

        if (atuais.length > 0) {
          const chaveAtual = chaveTransportadora(atuais[0]!);

          if (chaveAtual !== chavePagina) {
            toast.warning(
              'Limpe a seleção atual antes de selecionar outra transportadora.',
            );
            return prev;
          }
        }

        const todosSelecionados = elegiveis.every((item) => prev.has(item.id));

        if (todosSelecionados) {
          const next = new Set(prev);
          elegiveis.forEach((item) => next.delete(item.id));
          return next;
        }

        const next = new Set(prev);
        elegiveis.forEach((item) => next.add(item.id));
        return next;
      });
    },
    [ocorrenciasPorId, podeSelecionar],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  return {
    selectedIds,
    selecionados,
    transportadoraSelecionada,
    transportadoraIdSelecionada,
    valorTotalSelecionado,
    quantidadeSelecionada: selecionados.length,
    podeSelecionar,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isSelected,
  };
}
