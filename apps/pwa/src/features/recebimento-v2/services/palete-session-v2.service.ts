import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';

import { blockChecklistOpsDuringImpedimento } from '../lib/checklist-sync-impedimento';
import { normalizeParametrosConferenciaV2 } from '../lib/parametros-conferencia';
import { recebimentoV2Db } from '../local-db/db';
import type { SyncOperationRecord } from '../local-db/schema';

export const PALETE_OBRIGATORIO_MSG = 'Informe o palete antes de conferir';

export function generateUnitizadorCodigo(): string {
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `PLT-${hex}`;
}

function normalizePaleteCodigo(codigo: string): string {
  return codigo.trim();
}

export async function getActivePaleteCodigo(demandId: string): Promise<string | null> {
  const process = await recebimentoV2Db.processes.get(demandId);
  const codigo = process?.activePaleteCodigo?.trim();
  return codigo || null;
}

export async function setActivePaleteV2(demandId: string, codigo: string): Promise<void> {
  const normalized = normalizePaleteCodigo(codigo);
  if (!normalized) {
    throw new Error('Informe o ID do palete');
  }

  const updatedAt = Date.now();
  const modified = await recebimentoV2Db.processes.update(demandId, {
    activePaleteCodigo: normalized,
    updatedAt,
  });

  if (modified === 0) {
    const process = await recebimentoV2Db.processes.get(demandId);
    if (!process) {
      throw new Error('Demanda não encontrada para definir palete');
    }

    await recebimentoV2Db.processes.put({
      ...process,
      activePaleteCodigo: normalized,
      updatedAt,
    });
  }
}

export async function isControlaPaleteEnabled(demandId: string): Promise<boolean> {
  const process = await recebimentoV2Db.processes.get(demandId);
  if (!process?.unidadeId) return false;

  const unitConfig = await recebimentoV2Db.unitConfigs.get(process.unidadeId);
  const parametros = normalizeParametrosConferenciaV2(unitConfig?.config);
  return parametros.controlaPalete;
}

/**
 * ITEM_CONFERIR sem unitizadorCodigo ficam locais quando controlaPalete ou pesoVariavel (rede de segurança).
 */
export async function filterSyncableOperations(
  demandId: string,
  ops: SyncOperationRecord[],
): Promise<SyncOperationRecord[]> {
  const demand = await recebimentoV2Db.demands.get(demandId);
  if (demand?.situacao === 'impedido') {
    await blockChecklistOpsDuringImpedimento(demandId);
  }

  let filtered = ops.filter((op) => op.status !== 'blocked');

  if (demand?.situacao === 'impedido') {
    filtered = filtered.filter(
      (op) => op.opType !== RECEBIMENTO_V2_OP_TYPES.CHECKLIST_UPSERT,
    );
  }

  filtered = filtered.filter((op) => {
    if (op.dependsOn.length === 0) {
      return true;
    }

    return op.dependsOn.every((depId) => {
      const dep = ops.find((candidate) => candidate.id === depId);
      return dep?.status === 'synced';
    });
  });

  const controlaPalete = await isControlaPaleteEnabled(demandId);

  return filtered.filter((op) => {
    if (op.opType !== RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR) {
      return true;
    }

    const payload = op.payload as { unitizadorCodigo?: string; pesoVariavel?: boolean };
    const requiresUnitizador = controlaPalete || payload.pesoVariavel;
    if (!requiresUnitizador) {
      return true;
    }

    return Boolean(payload.unitizadorCodigo?.trim());
  });
}
