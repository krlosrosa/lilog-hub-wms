import { useCallback, useState } from 'react';

import { db } from '../db';
import type { EnqueueInput } from '../outbox';
import { enqueue } from '../outbox';
import { flushOutbox } from '../sync-engine';
import { useNetworkStatus } from './use-network';

export interface OfflineMutationInput extends EnqueueInput {
  optimisticUpdate?: () => Promise<void>;
}

export interface UseOfflineMutationOptions {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useOfflineMutation(options?: UseOfflineMutationOptions) {
  const { isOnline } = useNetworkStatus();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input: OfflineMutationInput) => {
      setIsPending(true);
      setError(null);

      try {
        if (input.optimisticUpdate) {
          await input.optimisticUpdate();
        }

        await enqueue(db, {
          endpoint: input.endpoint,
          method: input.method,
          payload: input.payload,
          photoIds: input.photoIds ?? [],
          label: input.label,
        });

        if (isOnline) {
          const result = await flushOutbox();
          if (result.failed > 0) {
            throw new Error(
              result.lastError ?? 'Algumas alterações falharam ao sincronizar',
            );
          }
        }

        options?.onSuccess?.();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Falha ao salvar alteração';
        setError(message);
        options?.onError?.(message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [isOnline, options?.onSuccess, options?.onError]
  );

  return {
    mutate,
    isPending,
    error,
    isOnline,
  };
}
