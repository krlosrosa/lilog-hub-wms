import type { ChecklistFormV2 } from '@/features/recebimento-v2/types/recebimento-v2.schema';
import type { ConferirItemV2Input } from '@/features/recebimento-v2/hooks/use-conferencia-v2';
import type { RegistrarAvariaInput } from '@/features/recebimento-v2/hooks/use-avaria-v2';
import type { TemperaturaEtapaV2 } from '@/features/recebimento-v2/hooks/use-temperatura-produto-v2';
import type { ChecklistPhotoIds } from '@/features/recebimento-v2/hooks/use-checklist-v2';

import type { ConferenceMode } from '../types/conference-mode';

export type FinalizationInput = {
  demandId: string;
  quantidadePaletes: number;
  teveSobreposicaoCarga: boolean;
  dock?: string;
};

export type FinalizationResult = {
  recebimentoId?: string;
  success: boolean;
};

export interface ConferenceExecutor {
  readonly mode: ConferenceMode;

  conferirItem(input: ConferirItemV2Input): Promise<string>;
  removeConference(conferenceId: string): Promise<void>;
  removeAddedItem(demandId: string, sku: string): Promise<void>;
  registrarAvaria(demandId: string, input: RegistrarAvariaInput): Promise<string>;
  removeAvaria(damageId: string): Promise<void>;
  salvarChecklist(
    demandId: string,
    form: ChecklistFormV2,
    dockId: string,
    dockLabel: string,
    photoIds: ChecklistPhotoIds,
    responsavelId?: number,
  ): Promise<void>;
  registrarTemperatura(
    demandId: string,
    entries: Array<{ etapa: TemperaturaEtapaV2; temperatura: number }>,
  ): Promise<void>;
  finalizarConferencia(input: FinalizationInput): Promise<FinalizationResult>;
}
