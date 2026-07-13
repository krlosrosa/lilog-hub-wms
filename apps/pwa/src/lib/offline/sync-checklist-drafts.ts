import {
  saveConferenciaContextToDb,
  setConferenciaContextStore,
} from '@/features/recebimento/lib/conferencia-context-store';
import { mapConferenciaContext } from '@/features/recebimento/lib/map-conferencia-itens';
import {
  fetchConferenciaContext,
  getRecebimentoByPreRecebimento,
  iniciarRecebimento,
  saveChecklist,
} from '@/features/recebimento/lib/recebimento-api';
import { uploadChecklistPhotos } from '@/features/recebimento/lib/upload-checklist-photos';

import { ApiClientError, isApiConfigured } from './api-client';
import { deleteChecklistDraft } from './checklist-cache';
import { db } from './db';

export async function syncChecklistDrafts(): Promise<{
  synced: number;
  failed: number;
}> {
  if (!navigator.onLine || !isApiConfigured()) {
    return { synced: 0, failed: 0 };
  }

  const drafts = await db.checklistDrafts.toArray();
  let synced = 0;
  let failed = 0;

  for (const draft of drafts) {
    try {
      const situacao = draft.situacao;
      let recebimentoId = draft.recebimentoId;

      if (situacao === 'agendado') {
        throw new Error(
          'Carga ainda não liberada para conferência no painel web.',
        );
      }

      if (!recebimentoId && situacao === 'liberado_para_conferencia') {
        if (!draft.responsavelId) {
          throw new Error('Responsável não definido para sincronizar checklist');
        }

        try {
          const recebimento = await iniciarRecebimento({
            preRecebimentoId: draft.demandId,
            docaId: draft.dockId,
            responsavelId: draft.responsavelId,
          });
          recebimentoId = recebimento.id;
        } catch (error) {
          if (error instanceof ApiClientError && error.status === 409) {
            const existing = await getRecebimentoByPreRecebimento(draft.demandId);
            recebimentoId = existing?.id ?? null;
          } else {
            throw error;
          }
        }
      }

      if (!recebimentoId) {
        throw new Error('Não foi possível obter recebimento para sincronizar checklist');
      }

      try {
        await uploadChecklistPhotos(recebimentoId, draft.photoSlots);
      } catch {
        // não bloqueia sincronização se upload das fotos falhar
      }

      try {
        await saveChecklist(recebimentoId, {
          lacre: draft.form.lacre || undefined,
          tempBau: draft.form.tempBau,
          conditions: draft.form.conditions,
          observacoes: draft.form.observacoes || undefined,
          photoCount: draft.photoSlots.flatMap((slot) => slot.photoIds).length,
        });
      } catch {
        // não bloqueia se persistência do checklist falhar
      }

      const refreshed = await fetchConferenciaContext(draft.demandId);
      const mapped = mapConferenciaContext(refreshed);
      setConferenciaContextStore(draft.demandId, mapped);
      await saveConferenciaContextToDb(draft.demandId, mapped);

      const cachedDemand = await db.demands.get(draft.demandId);
      if (cachedDemand) {
        await db.demands.put({
          ...cachedDemand,
          dock: draft.dockLabel,
          recebimentoId,
          status: 'em_conferencia',
          preRecebimentoSituacao: 'em_conferencia',
        });
      }

      await deleteChecklistDraft(draft.demandId);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}
