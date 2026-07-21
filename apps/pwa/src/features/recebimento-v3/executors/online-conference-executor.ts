import { pushDemandPatchFromLocal } from '@/features/recebimento-v2/services/push-demand-patch.service';
import { processPhotoQueue } from '@/features/recebimento-v2/services/photo-upload-queue.service';

import type {
  ConferenceExecutor,
  FinalizationInput,
  FinalizationResult,
} from './conference-executor.interface';
import {
  writeConferirItemV3,
  writeFinalizarEncerrarOpV3,
  writeRegistrarAvariaV3,
  writeRegistrarTemperaturaV3,
  writeRemoveAddedItemV3,
  writeRemoveAvariaV3,
  writeRemoveConferenceV3,
  writeSalvarChecklistV3,
} from '../services/conference-write.helpers';
import { assertNetworkOnline } from '../lib/network';

async function syncImmediately(demandId: string): Promise<void> {
  await pushDemandPatchFromLocal(demandId);
  await processPhotoQueue(demandId);
}

export class OnlineConferenceExecutor implements ConferenceExecutor {
  readonly mode = 'online' as const;

  async conferirItem(input: Parameters<ConferenceExecutor['conferirItem']>[0]): Promise<string> {
    assertNetworkOnline('É necessário conexão com a internet para conferir itens.');
    const conferenceId = await writeConferirItemV3(input);
    await syncImmediately(input.demandId);
    return conferenceId;
  }

  async removeConference(conferenceId: string): Promise<void> {
    const conference = await import('@/features/recebimento-v2/local-db/db').then((m) =>
      m.recebimentoV2Db.conferences.get(conferenceId),
    );
    if (!conference) return;

    assertNetworkOnline('É necessário conexão com a internet para remover itens.');
    await writeRemoveConferenceV3(conferenceId, false);
    await syncImmediately(conference.demandId);
  }

  async removeAddedItem(demandId: string, sku: string): Promise<void> {
    assertNetworkOnline('É necessário conexão com a internet para remover itens.');
    await writeRemoveAddedItemV3(demandId, sku);
    await syncImmediately(demandId);
  }

  async registrarAvaria(
    demandId: string,
    input: Parameters<ConferenceExecutor['registrarAvaria']>[1],
  ): Promise<string> {
    assertNetworkOnline('É necessário conexão com a internet para registrar avarias.');
    const damageId = await writeRegistrarAvariaV3(demandId, input);
    await syncImmediately(demandId);
    return damageId;
  }

  async removeAvaria(damageId: string): Promise<void> {
    const damage = await import('@/features/recebimento-v2/local-db/db').then((m) =>
      m.recebimentoV2Db.damages.get(damageId),
    );
    if (!damage) return;

    assertNetworkOnline('É necessário conexão com a internet para remover avarias.');
    await writeRemoveAvariaV3(damage.demandId, damageId, false);
    await syncImmediately(damage.demandId);
  }

  async salvarChecklist(
    demandId: string,
    form: Parameters<ConferenceExecutor['salvarChecklist']>[1],
    dockId: string,
    dockLabel: string,
    photoIds: Parameters<ConferenceExecutor['salvarChecklist']>[4],
    responsavelId?: number,
  ): Promise<void> {
    assertNetworkOnline('É necessário conexão com a internet para salvar o checklist.');
    await writeSalvarChecklistV3({ demandId, form, dockId, dockLabel, photoIds, responsavelId });
    await syncImmediately(demandId);
  }

  async registrarTemperatura(
    demandId: string,
    entries: Parameters<ConferenceExecutor['registrarTemperatura']>[1],
  ): Promise<void> {
    assertNetworkOnline('É necessário conexão com a internet para registrar temperaturas.');
    await writeRegistrarTemperaturaV3(demandId, entries);
    await syncImmediately(demandId);
  }

  async finalizarConferencia(input: FinalizationInput): Promise<FinalizationResult> {
    assertNetworkOnline('É necessário conexão com a internet para finalizar a conferência.');
    await writeFinalizarEncerrarOpV3(input);
    await syncImmediately(input.demandId);

    const process = await import('@/features/recebimento-v2/local-db/db').then((m) =>
      m.recebimentoV2Db.processes.get(input.demandId),
    );

    return {
      success: true,
      recebimentoId: process?.recebimentoId,
    };
  }
}

export const onlineConferenceExecutor = new OnlineConferenceExecutor();
