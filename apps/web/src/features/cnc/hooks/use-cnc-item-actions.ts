'use client';

import { useCallback, useState } from 'react';

import { toast } from 'sonner';

import {
  atualizarItemCnc,
  removerItemCnc,
  type UpdateCncItemBody,
} from '@/features/cnc/lib/cnc-api';

export function useCncItemActions(
  cncId: string,
  onSalvo?: () => void | Promise<void>,
) {
  const [processando, setProcessando] = useState(false);

  const atualizar = useCallback(
    async (itemId: string, body: UpdateCncItemBody) => {
      setProcessando(true);

      try {
        await atualizarItemCnc(cncId, itemId, body);
        toast.success('Item atualizado com sucesso.');
        await onSalvo?.();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar o item.';

        toast.error(message);
        throw error;
      } finally {
        setProcessando(false);
      }
    },
    [cncId, onSalvo],
  );

  const remover = useCallback(
    async (itemId: string) => {
      setProcessando(true);

      try {
        await removerItemCnc(cncId, itemId);
        toast.success('Item removido com sucesso.');
        await onSalvo?.();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Não foi possível remover o item.';

        toast.error(message);
        throw error;
      } finally {
        setProcessando(false);
      }
    },
    [cncId, onSalvo],
  );

  return {
    atualizar,
    remover,
    processando,
  };
}
