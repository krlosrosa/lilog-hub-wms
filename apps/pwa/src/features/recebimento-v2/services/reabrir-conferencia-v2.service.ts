import { recebimentoV2Db } from '../local-db/db';
import { isConferenciaBloqueadaError } from '../lib/sync-conferencia-bloqueada';
import { reabrirConferencia } from '../api/sync-api';
import {
  resetAutoSyncBackoff,
  triggerAutoSyncIfPending,
} from './auto-sync-v2.service';

export async function reabrirConferenciaV2(demandId: string): Promise<void> {
  const process = await recebimentoV2Db.processes.get(demandId);
  const recebimentoId = process?.recebimentoId?.trim();

  if (!recebimentoId) {
    throw new Error(
      'Recebimento ainda não foi iniciado no servidor. Sincronize o checklist antes de reabrir.',
    );
  }

  const response = await reabrirConferencia(recebimentoId);
  const now = Date.now();

  await recebimentoV2Db.transaction(
    'rw',
    [recebimentoV2Db.demands, recebimentoV2Db.processes, recebimentoV2Db.syncOperations],
    async () => {
      const situacao = response.situacao === 'em_conferencia' ? 'em_conferencia' : response.situacao;

      await recebimentoV2Db.demands.update(demandId, {
        situacao,
        status: situacao,
        updatedAt: now,
      });

      await recebimentoV2Db.processes.update(demandId, {
        status: 'working',
        autoSyncPaused: false,
        errorMessage: undefined,
        updatedAt: now,
      });

      const blockedOps = await recebimentoV2Db.syncOperations
        .where('aggregateId')
        .equals(demandId)
        .filter(
          (op) =>
            (op.status === 'retry' || op.status === 'rejected') &&
            isConferenciaBloqueadaError(op.errorMessage),
        )
        .toArray();

      await Promise.all(
        blockedOps.map((op) =>
          recebimentoV2Db.syncOperations.update(op.id, {
            status: 'pending',
            attempts: 0,
            nextAttemptAt: undefined,
            errorMessage: undefined,
            updatedAt: now,
          }),
        ),
      );
    },
  );

  resetAutoSyncBackoff(demandId);
  triggerAutoSyncIfPending(demandId);
}
