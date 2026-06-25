import type { ConfirmarItemArmazenagemPayload } from '@lilog/contracts';

import { useOfflineMutation } from '@/lib/offline/hooks/use-offline-mutation';

export function useConfirmarItem(
  demandaId: string,
  options?: { onSuccess?: () => void; onError?: (msg: string) => void },
) {
  const { mutate, isPending, error } = useOfflineMutation({
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  const confirmar = async (
    itemId: string,
    payload: ConfirmarItemArmazenagemPayload,
  ) => {
    await mutate({
      endpoint: `/armazenagem/demandas/${encodeURIComponent(demandaId)}/itens/${encodeURIComponent(itemId)}/confirmar`,
      method: 'POST',
      payload,
      label: `Armazenagem item ${itemId.slice(0, 8)}`,
    });
  };

  return { confirmar, isPending, error };
}
