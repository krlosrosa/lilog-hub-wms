import { db } from '@/lib/offline/db';
import { enqueue, type EnqueueInput } from '@/lib/offline/outbox';
import { flushOutbox } from '@/lib/offline/sync-engine';

import type { SubmitAvariaPayload } from '../types/recebimento.api';

async function fireAndForget(
  entry: EnqueueInput,
  optimisticUpdate?: () => void | Promise<void>,
): Promise<void> {
  if (optimisticUpdate) {
    await optimisticUpdate();
  }

  await enqueue(db, entry);
  void flushOutbox();
}

export async function syncAvariaRecebimento(
  recebimentoId: string,
  payload: SubmitAvariaPayload,
  photoIds: number[],
  label: string,
  optimisticUpdate?: () => void | Promise<void>,
): Promise<void> {
  await fireAndForget(
    {
      endpoint: `/recebimentos/${encodeURIComponent(recebimentoId)}/avarias`,
      method: 'POST',
      payload,
      photoIds,
      label,
    },
    optimisticUpdate,
  );
}

export async function syncEncerrarConferencia(
  recebimentoId: string,
  label: string,
): Promise<void> {
  await fireAndForget({
    endpoint: `/recebimentos/${encodeURIComponent(recebimentoId)}/encerrar`,
    method: 'PUT',
    payload: {},
    photoIds: [],
    label,
  });
}
