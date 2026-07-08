import {
  atualizarStatusDevolucao,
  registrarConferenciaItens,
  salvarChecklistDevolucao,
  type AtualizarStatusDevolucaoPayload,
  type RegistrarConferenciaItensPayload,
  type SalvarChecklistDevolucaoPayload,
} from '@/features/devolucao/lib/devolucao-api';
import { request } from '@/lib/offline/api-client';
import { db } from '@/lib/offline/db';
import { enqueue } from '@/lib/offline/outbox';
import { flushOutbox } from '@/lib/offline/sync-engine';

async function tryOnlineOrEnqueue(input: {
  endpoint: string;
  method: 'PATCH' | 'POST';
  payload: unknown;
  label: string;
  executeOnline: () => Promise<unknown>;
}): Promise<void> {
  if (navigator.onLine) {
    try {
      await input.executeOnline();
      return;
    } catch {
      // fallback to outbox
    }
  }

  await enqueue(db, {
    endpoint: input.endpoint,
    method: input.method,
    payload: input.payload,
    photoIds: [],
    label: input.label,
  });

  if (navigator.onLine) {
    await flushOutbox();
  }
}

export async function syncDevolucaoStatus(
  demandaId: string,
  unidadeId: string,
  payload: AtualizarStatusDevolucaoPayload,
  label: string,
): Promise<void> {
  const endpoint = `/devolucao/demandas/${encodeURIComponent(demandaId)}/status?unidadeId=${encodeURIComponent(unidadeId)}`;

  await tryOnlineOrEnqueue({
    endpoint,
    method: 'PATCH',
    payload,
    label,
    executeOnline: () => atualizarStatusDevolucao(demandaId, unidadeId, payload),
  });
}

export async function syncDevolucaoChecklist(
  demandaId: string,
  unidadeId: string,
  payload: SalvarChecklistDevolucaoPayload,
  label: string,
): Promise<void> {
  const endpoint = `/devolucao/demandas/${encodeURIComponent(demandaId)}/checklist?unidadeId=${encodeURIComponent(unidadeId)}`;

  await tryOnlineOrEnqueue({
    endpoint,
    method: 'POST',
    payload,
    label,
    executeOnline: () => salvarChecklistDevolucao(demandaId, unidadeId, payload),
  });
}

export async function syncDevolucaoConferencia(
  demandaId: string,
  payload: RegistrarConferenciaItensPayload,
  label: string,
): Promise<void> {
  const endpoint = `/devolucao/demandas/${encodeURIComponent(demandaId)}/conferencia`;

  await tryOnlineOrEnqueue({
    endpoint,
    method: 'PATCH',
    payload,
    label,
    executeOnline: () => registrarConferenciaItens(demandaId, payload),
  });
}

export async function flushDevolucaoOutboxForDemanda(
  demandaId: string,
): Promise<void> {
  const entries = await db.outbox.toArray();
  const related = entries.filter((entry) => entry.endpoint.includes(demandaId));

  for (const entry of related) {
    if (!entry.id) continue;
    await db.outbox.update(entry.id, { status: 'pending', errorMessage: undefined });
  }

  if (navigator.onLine) {
    await flushOutbox();
  }
}

export async function requestDevolucaoEndpoint<T>(
  endpoint: string,
  method: 'PATCH' | 'POST',
  payload: unknown,
): Promise<T> {
  return request<T>(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
