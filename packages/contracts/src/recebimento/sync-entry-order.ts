import { RECEBIMENTO_V2_OP_TYPES } from '../sync/index.js';

// ---------------------------------------------------------------------------
// Priority map — lower number = higher priority (processed first)
// ---------------------------------------------------------------------------

export const RECEBIMENTO_V2_OP_PRIORITY: ReadonlyMap<string, number> = new Map([
  [RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT, 10],
  [RECEBIMENTO_V2_OP_TYPES.TEMPERATURA_UPSERT, 20],
  [RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR, 30],
  [RECEBIMENTO_V2_OP_TYPES.ITEM_REMOVE_BY_PRODUTO, 40],
  [RECEBIMENTO_V2_OP_TYPES.ITEM_LINHA_REMOVE, 50],
  [RECEBIMENTO_V2_OP_TYPES.PALETE_REMOVE, 60],
  [RECEBIMENTO_V2_OP_TYPES.PESAGEM_REMOVE, 70],
  [RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR, 80],
  [RECEBIMENTO_V2_OP_TYPES.AVARIA_REMOVER, 85],
  [RECEBIMENTO_V2_OP_TYPES.AVARIA_CLEAR, 90],
  [RECEBIMENTO_V2_OP_TYPES.CONFERENCIA_ENCERRAR, 100],
]);

const DEFAULT_PRIORITY = 999;

/**
 * Sorts Recebimento V2 operations by:
 * 1. opType priority (ascending)
 * 2. sequence (ascending)
 * 3. createdAt (ascending) as tiebreaker
 */
export function sortRecebimentoV2Operations<
  T extends { opType: string; sequence: number; createdAt: number },
>(ops: T[]): T[] {
  return [...ops].sort((a, b) => {
    const pa = RECEBIMENTO_V2_OP_PRIORITY.get(a.opType) ?? DEFAULT_PRIORITY;
    const pb = RECEBIMENTO_V2_OP_PRIORITY.get(b.opType) ?? DEFAULT_PRIORITY;
    if (pa !== pb) return pa - pb;
    if (a.sequence !== b.sequence) return a.sequence - b.sequence;
    return a.createdAt - b.createdAt;
  });
}
