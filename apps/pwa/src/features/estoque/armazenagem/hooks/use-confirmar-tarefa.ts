import type { ConfirmarTarefaArmazenagemPayload } from '../lib/armazenagem-api';

import { useOfflineMutation } from '@/lib/offline/hooks/use-offline-mutation';

export function useConfirmarTarefa(
  demandaId: string,
  options?: { onSuccess?: () => void; onError?: (msg: string) => void },
) {
  const { mutate, isPending, error } = useOfflineMutation({
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });

  const confirmar = async (
    tarefaId: string,
    payload: ConfirmarTarefaArmazenagemPayload,
  ) => {
    await mutate({
      endpoint: `/armazenagem/demandas/${encodeURIComponent(demandaId)}/tarefas/${encodeURIComponent(tarefaId)}/confirmar`,
      method: 'POST',
      payload,
      label: `Armazenagem palete ${tarefaId.slice(0, 8)}`,
    });
  };

  return { confirmar, isPending, error };
}
