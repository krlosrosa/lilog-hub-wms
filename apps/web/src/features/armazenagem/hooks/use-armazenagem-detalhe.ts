'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ApiClientError } from '@/lib/api';

import { enrichItemArmazenagem } from '../lib/enrich-item-armazenagem';
import {
  definirEnderecoSugeridoItemArmazenagem,
  getDemandaArmazenagem,
  listEnderecosDisponiveisArmazenagem,
} from '../lib/armazenagem-api';
import type {
  DemandaArmazenagemDetailView,
  ItemArmazenagemView,
} from '../types/armazenagem.api';

export function useArmazenagemDetalhe(demandaId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [demanda, setDemanda] = useState<DemandaArmazenagemDetailView | null>(
    null,
  );
  const [itemSelecionado, setItemSelecionado] = useState<ItemArmazenagemView | null>(
    null,
  );

  const carregar = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getDemandaArmazenagem(demandaId);
      const itens = await Promise.all(
        response.itens.map((item) => enrichItemArmazenagem(item)),
      );

      setDemanda({ ...response, itens });
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível carregar a demanda de armazenagem';
      toast.error(message);
      setDemanda(null);
    } finally {
      setIsLoading(false);
    }
  }, [demandaId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const progresso = useMemo(() => {
    const total = demanda?.itens.length ?? 0;
    const armazenados =
      demanda?.itens.filter((item) => item.status === 'armazenado').length ?? 0;
    const comEndereco =
      demanda?.itens.filter((item) => item.enderecoSugeridoId).length ?? 0;
    const percent = total > 0 ? Math.round((armazenados / total) * 100) : 0;

    return { total, armazenados, comEndereco, percent };
  }, [demanda]);

  const abrirSelecaoEndereco = useCallback((item: ItemArmazenagemView) => {
    if (item.status === 'armazenado') {
      toast.info('Item já armazenado — endereço não pode ser alterado.');
      return;
    }

    setItemSelecionado(item);
  }, []);

  const fecharSelecaoEndereco = useCallback(() => {
    setItemSelecionado(null);
  }, []);

  const salvarEnderecoSugerido = useCallback(
    async (enderecoSugeridoId: string) => {
      if (!itemSelecionado) return;

      setIsSaving(true);

      try {
        const updated = await definirEnderecoSugeridoItemArmazenagem(
          demandaId,
          itemSelecionado.id,
          enderecoSugeridoId,
        );

        const [enriched] = await Promise.all([enrichItemArmazenagem(updated)]);

        setDemanda((prev) =>
          prev
            ? {
                ...prev,
                itens: prev.itens.map((item) =>
                  item.id === enriched.id ? enriched : item,
                ),
              }
            : prev,
        );

        toast.success('Endereço de armazenagem definido', {
          description: enriched.enderecoSugeridoLabel ?? enriched.enderecoSugeridoId,
        });
        setItemSelecionado(null);
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível salvar o endereço';
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [demandaId, itemSelecionado],
  );

  const buscarEnderecosDisponiveis = useCallback(
    async (search: string, page = 1) => {
      if (!itemSelecionado) {
        return { items: [], total: 0, page: 1, limit: 20 };
      }

      return listEnderecosDisponiveisArmazenagem(
        demandaId,
        itemSelecionado.id,
        { search, page, limit: 20 },
      );
    },
    [demandaId, itemSelecionado],
  );

  return {
    isLoading,
    isSaving,
    demanda,
    progresso,
    itemSelecionado,
    abrirSelecaoEndereco,
    fecharSelecaoEndereco,
    salvarEnderecoSugerido,
    buscarEnderecosDisponiveis,
    recarregar: carregar,
  };
}
