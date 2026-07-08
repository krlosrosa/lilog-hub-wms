'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import {
  atualizarItemProcessoDebito,
  atualizarItensProcessoDebitoEmMassa,
  removerItemProcessoDebito,
  type AtualizarItemProcessoDebitoBody,
} from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import type { DebitoItemStatus } from '@/features/debito-transportadora/types/debito.schema';
import { ApiClientError } from '@/lib/api';

type UseDebitoItemActionsOptions = {
  processoId: string;
  unidadeId: string | null;
  onRefetch: () => Promise<void>;
};

export function useDebitoItemActions({
  processoId,
  unidadeId,
  onRefetch,
}: UseDebitoItemActionsOptions) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((itemIds: readonly string[]) => {
    setSelectedIds((prev) => {
      const allSelected =
        itemIds.length > 0 && itemIds.every((id) => prev.has(id));

      if (allSelected) {
        return new Set();
      }

      return new Set(itemIds);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const atualizarItem = useCallback(
    async (itemId: string, body: AtualizarItemProcessoDebitoBody) => {
      if (!unidadeId) {
        return;
      }

      setIsUpdating(true);

      try {
        await atualizarItemProcessoDebito(processoId, itemId, unidadeId, body);
        await onRefetch();
        toast.success('Item atualizado');
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Não foi possível atualizar o item.';

        toast.error(message);
      } finally {
        setIsUpdating(false);
      }
    },
    [onRefetch, processoId, unidadeId],
  );

  const removerItem = useCallback(
    async (itemId: string) => {
      if (!unidadeId) {
        return;
      }

      setIsRemoving(true);

      try {
        await removerItemProcessoDebito(processoId, itemId, unidadeId);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        await onRefetch();
        toast.success('Item removido');
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Não foi possível remover o item.';

        toast.error(message);
      } finally {
        setIsRemoving(false);
      }
    },
    [onRefetch, processoId, unidadeId],
  );

  const aplicarStatusEmMassa = useCallback(
    async (status: DebitoItemStatus) => {
      if (!unidadeId || selectedIds.size === 0) {
        return;
      }

      setIsUpdating(true);

      try {
        await atualizarItensProcessoDebitoEmMassa(processoId, unidadeId, {
          itens: [...selectedIds].map((itemId) => ({ itemId, status })),
        });

        await onRefetch();
        clearSelection();
        toast.success('Status aplicado aos itens selecionados');
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Não foi possível aplicar o status em massa.';

        toast.error(message);
      } finally {
        setIsUpdating(false);
      }
    },
    [clearSelection, onRefetch, processoId, selectedIds, unidadeId],
  );

  return {
    isUpdating,
    isRemoving,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    atualizarItem,
    removerItem,
    aplicarStatusEmMassa,
  };
}
