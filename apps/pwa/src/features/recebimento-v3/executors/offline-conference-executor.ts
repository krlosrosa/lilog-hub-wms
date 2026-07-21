import type {
  ConferenceExecutor,
  FinalizationInput,
  FinalizationResult,
} from './conference-executor.interface';
import {
  writeConferirItemV3,
  writeRegistrarAvariaV3,
  writeRegistrarTemperaturaV3,
  writeRemoveAddedItemV3,
  writeRemoveAvariaV3,
  writeRemoveConferenceV3,
  writeSalvarChecklistV3,
} from '../services/conference-write.helpers';

export class OfflineConferenceExecutor implements ConferenceExecutor {
  readonly mode = 'offline' as const;

  async conferirItem(input: Parameters<ConferenceExecutor['conferirItem']>[0]): Promise<string> {
    return writeConferirItemV3(input);
  }

  async removeConference(conferenceId: string): Promise<void> {
    await writeRemoveConferenceV3(conferenceId, true);
  }

  async removeAddedItem(demandId: string, sku: string): Promise<void> {
    await writeRemoveAddedItemV3(demandId, sku);
  }

  async registrarAvaria(
    demandId: string,
    input: Parameters<ConferenceExecutor['registrarAvaria']>[1],
  ): Promise<string> {
    return writeRegistrarAvariaV3(demandId, input);
  }

  async removeAvaria(damageId: string): Promise<void> {
    const damage = await import('@/features/recebimento-v2/local-db/db').then((m) =>
      m.recebimentoV2Db.damages.get(damageId),
    );
    if (!damage) return;
    await writeRemoveAvariaV3(damage.demandId, damageId, true);
  }

  async salvarChecklist(
    demandId: string,
    form: Parameters<ConferenceExecutor['salvarChecklist']>[1],
    dockId: string,
    dockLabel: string,
    photoIds: Parameters<ConferenceExecutor['salvarChecklist']>[4],
    responsavelId?: number,
  ): Promise<void> {
    await writeSalvarChecklistV3({ demandId, form, dockId, dockLabel, photoIds, responsavelId });
  }

  async registrarTemperatura(
    demandId: string,
    entries: Parameters<ConferenceExecutor['registrarTemperatura']>[1],
  ): Promise<void> {
    await writeRegistrarTemperaturaV3(demandId, entries);
  }

  async finalizarConferencia(_input: FinalizationInput): Promise<FinalizationResult> {
    throw new Error('Use finalizarOfflineV3 para finalização no modo offline.');
  }
}

export const offlineConferenceExecutor = new OfflineConferenceExecutor();
