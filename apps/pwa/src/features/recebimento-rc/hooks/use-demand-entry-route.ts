import type { DemandView } from '@lilog/contracts';
import { useMemo } from 'react';

import { useChecklistReplicache } from '@/lib/replicache/hooks';

import { useLocalChecklistCompleteRc } from './use-checklist-rc';
import { isChecklistCompleteRc } from '../lib/is-checklist-complete-rc';

const CONFERENCE_SITUACOES = new Set(['em_conferencia', 'conferido']);

export type DemandEntryRoute =
  | '/recebimento-rc/$id/itens'
  | '/recebimento-rc/$id/checklist';

export function resolveDemandEntryRoute(
  demanda: Pick<DemandView, 'situacao'> | null | undefined,
  checklist: Parameters<typeof isChecklistCompleteRc>[0],
  hasLocalChecklistComplete = false,
): DemandEntryRoute {
  if (demanda?.situacao === 'impedido') {
    return '/recebimento-rc/$id/checklist';
  }

  if (hasLocalChecklistComplete) {
    return '/recebimento-rc/$id/itens';
  }

  if (demanda?.situacao && CONFERENCE_SITUACOES.has(demanda.situacao)) {
    return '/recebimento-rc/$id/itens';
  }

  if (isChecklistCompleteRc(checklist)) {
    return '/recebimento-rc/$id/itens';
  }

  return '/recebimento-rc/$id/checklist';
}

export function useDemandEntryRoute(preRecebimentoId: string, demanda: DemandView) {
  const checklist = useChecklistReplicache(preRecebimentoId);
  const hasLocalChecklistComplete = useLocalChecklistCompleteRc(preRecebimentoId);

  return useMemo(
    () => resolveDemandEntryRoute(demanda, checklist, hasLocalChecklistComplete ?? false),
    [checklist, demanda, hasLocalChecklistComplete],
  );
}
