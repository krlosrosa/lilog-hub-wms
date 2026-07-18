import { RECEBIMENTO_V2_OP_TYPES } from '@lilog/contracts';
import { beforeEach, describe, expect, it } from 'vitest';

import { recebimentoV2Db } from '../local-db/db';
import type { DamageRecord, SyncOperationRecord } from '../local-db/schema';
import {
  collectAvariaPhotoIds,
  collectAvariaPhotoUploadTargets,
  dismissPendingPhotos,
  hasPendingPhotoUploads,
  recoverStuckSyncState,
  resolveMediaIdsForDamage,
  resolveServerAvariaIdForDamage,
} from './sync-photo.helpers';

const DEMAND_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('recoverStuckSyncState', () => {
  beforeEach(async () => {
    await recebimentoV2Db.damages.clear();
    await recebimentoV2Db.conferences.clear();
    await recebimentoV2Db.syncOperations.clear();
    await recebimentoV2Db.checklists.clear();
    await recebimentoV2Db.media.clear();
    await recebimentoV2Db.processes.put({
      id: DEMAND_ID,
      unidadeId: 'ITB',
      adapter: 'recebimento-v2',
      status: 'syncing',
      serverRevision: 1,
      baseRevision: 1,
      flowVersion: 'v2',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  });

  it('marks stuck avaria op as synced when damage already has serverAvariaId', async () => {
    const damage: DamageRecord = {
      id: 'damage-1',
      demandId: DEMAND_ID,
      sku: '600598361',
      description: 'Avaria teste',
      quantity: 1,
      quantidadeCaixa: 1,
      quantidadeUnidade: 0,
      registradoAt: new Date().toISOString(),
      syncStatus: 'synced',
      serverAvariaId: 'avaria-server-1',
      updatedAt: Date.now(),
    };

    const stuckAvariaOp: SyncOperationRecord = {
      id: crypto.randomUUID(),
      aggregateId: DEMAND_ID,
      module: 'damage',
      opType: RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {
        damageId: 'damage-1',
        tipo: '1',
        natureza: '1',
        causa: '1',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
      },
      attachmentIds: [],
      status: 'syncing',
      attempts: 0,
      createdAt: 1,
      updatedAt: 1,
    };

    await recebimentoV2Db.damages.put(damage);
    await recebimentoV2Db.syncOperations.put(stuckAvariaOp);

    await recoverStuckSyncState(DEMAND_ID);

    const recovered = await recebimentoV2Db.syncOperations.get(stuckAvariaOp.id);
    expect(recovered?.status).toBe('synced');
  });

  it('resets stuck avaria op to pending when damage has no serverAvariaId', async () => {
    const damage: DamageRecord = {
      id: 'damage-2',
      demandId: DEMAND_ID,
      sku: '600598361',
      description: 'Avaria teste',
      quantity: 1,
      quantidadeCaixa: 1,
      quantidadeUnidade: 0,
      registradoAt: new Date().toISOString(),
      syncStatus: 'pending',
      updatedAt: Date.now(),
    };

    const stuckAvariaOp: SyncOperationRecord = {
      id: crypto.randomUUID(),
      aggregateId: DEMAND_ID,
      module: 'damage',
      opType: RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {
        damageId: 'damage-2',
        tipo: '1',
        natureza: '1',
        causa: '1',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
      },
      attachmentIds: [],
      status: 'syncing',
      attempts: 0,
      createdAt: 1,
      updatedAt: 1,
    };

    await recebimentoV2Db.damages.put(damage);
    await recebimentoV2Db.syncOperations.put(stuckAvariaOp);

    await recoverStuckSyncState(DEMAND_ID);

    const recovered = await recebimentoV2Db.syncOperations.get(stuckAvariaOp.id);
    expect(recovered?.status).toBe('pending');
  });

  it('marks stuck PVAR conferir op as synced when conference already has serverPesagemId', async () => {
    const conferenceId = crypto.randomUUID();

    await recebimentoV2Db.conferences.put({
      id: conferenceId,
      demandId: DEMAND_ID,
      sku: 'SKU-PVAR',
      quantity: 1,
      recebidaCaixa: 1,
      peso: 12.5,
      isPvarBox: true,
      conferidoAt: new Date().toISOString(),
      syncStatus: 'synced',
      serverPesagemId: 'pesagem-server-1',
      updatedAt: Date.now(),
    });

    const stuckConferirOp: SyncOperationRecord = {
      id: crypto.randomUUID(),
      aggregateId: DEMAND_ID,
      module: 'conference',
      opType: RECEBIMENTO_V2_OP_TYPES.ITEM_CONFERIR,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {
        conferenceId,
        pesoVariavel: true,
        produtoId: 'PVAR-001',
        quantidadeRecebida: 1,
        unidadeMedida: 'CX',
        pesoRecebido: 12.5,
      },
      attachmentIds: [],
      status: 'syncing',
      attempts: 0,
      createdAt: 1,
      updatedAt: 1,
    };

    await recebimentoV2Db.syncOperations.put(stuckConferirOp);

    await recoverStuckSyncState(DEMAND_ID);

    const recovered = await recebimentoV2Db.syncOperations.get(stuckConferirOp.id);
    expect(recovered?.status).toBe('synced');
  });

  it('resets photos stuck in uploading or error back to local', async () => {
    const uploadingPhotoId = crypto.randomUUID();
    const errorPhotoId = crypto.randomUUID();

    await recebimentoV2Db.media.bulkPut([
      {
        id: uploadingPhotoId,
        processId: DEMAND_ID,
        ownerType: 'checklist',
        ownerId: `checklist-${DEMAND_ID}-lacre`,
        blob: new Blob(['photo-1'], { type: 'image/jpeg' }),
        mimeType: 'image/jpeg',
        status: 'uploading',
        createdAt: new Date().toISOString(),
      },
      {
        id: errorPhotoId,
        processId: DEMAND_ID,
        ownerType: 'checklist',
        ownerId: `checklist-${DEMAND_ID}-bauFechado`,
        blob: new Blob(['photo-2'], { type: 'image/jpeg' }),
        mimeType: 'image/jpeg',
        status: 'error',
        errorMessage: 'Network error',
        errorStep: 'put',
        createdAt: new Date().toISOString(),
      },
    ]);

    await recebimentoV2Db.checklists.put({
      demandId: DEMAND_ID,
      id: crypto.randomUUID(),
      dock: 'D1',
      lacre: '123',
      conditions: {},
      photoMediaIds: {
        lacre: [uploadingPhotoId],
        bauFechado: [errorPhotoId],
      },
      savedAt: new Date().toISOString(),
      syncStatus: 'pending',
      updatedAt: Date.now(),
    });

    await recoverStuckSyncState(DEMAND_ID);

    const uploadingPhoto = await recebimentoV2Db.media.get(uploadingPhotoId);
    const errorPhoto = await recebimentoV2Db.media.get(errorPhotoId);

    expect(uploadingPhoto?.status).toBe('local');
    expect(errorPhoto?.status).toBe('local');
    expect(errorPhoto?.errorMessage).toBeUndefined();
    expect(errorPhoto?.errorStep).toBeUndefined();
  });
});

describe('avaria photo upload resolution', () => {
  beforeEach(async () => {
    await recebimentoV2Db.damages.clear();
    await recebimentoV2Db.syncOperations.clear();
    await recebimentoV2Db.media.clear();
  });

  it('collectAvariaPhotoUploadTargets resolves mediaIds from synced op after snapshot damage', async () => {
    const mediaId = crypto.randomUUID();
    const serverAvariaId = 'avaria-server-1';
    const sku = '600598361';

    await recebimentoV2Db.media.put({
      id: mediaId,
      processId: DEMAND_ID,
      ownerType: 'avaria',
      ownerId: 'avaria-session-test',
      blob: new Blob(['photo'], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      status: 'local',
      createdAt: new Date().toISOString(),
    });

    await recebimentoV2Db.damages.put({
      id: serverAvariaId,
      demandId: DEMAND_ID,
      sku,
      description: 'Avaria snapshot',
      quantity: 1,
      quantidadeCaixa: 1,
      quantidadeUnidade: 0,
      registradoAt: new Date().toISOString(),
      syncStatus: 'synced',
      serverAvariaId,
      updatedAt: Date.now(),
    });

    await recebimentoV2Db.syncOperations.put({
      id: crypto.randomUUID(),
      aggregateId: DEMAND_ID,
      module: 'damage',
      opType: RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {
        damageId: 'local-damage-id',
        serverAvariaId,
        mediaIds: [mediaId],
        tipo: '1',
        natureza: '1',
        causa: '1',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
      },
      attachmentIds: [mediaId],
      status: 'synced',
      attempts: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    const targets = await collectAvariaPhotoUploadTargets(DEMAND_ID);

    expect(targets).toEqual([
      {
        serverAvariaId,
        mediaIds: [mediaId],
      },
    ]);
  });

  it('resolveMediaIdsForDamage returns empty when damage has no mediaIds and no synced op', async () => {
    const damage: DamageRecord = {
      id: 'damage-local',
      demandId: DEMAND_ID,
      sku: '600598361',
      description: 'Avaria teste',
      quantity: 1,
      quantidadeCaixa: 1,
      quantidadeUnidade: 0,
      registradoAt: new Date().toISOString(),
      syncStatus: 'synced',
      serverAvariaId: 'avaria-server-2',
      updatedAt: Date.now(),
    };

    const mediaIds = await resolveMediaIdsForDamage(damage);
    expect(mediaIds).toEqual([]);
  });

  it('collectAvariaPhotoIds ignores orphan and deleted-damage media', async () => {
    const linkedMediaId = crypto.randomUUID();
    const orphanMediaId = crypto.randomUUID();
    const deletedDamageMediaId = crypto.randomUUID();
    const activeDamageId = crypto.randomUUID();
    const deletedDamageId = crypto.randomUUID();

    await recebimentoV2Db.media.bulkPut([
      {
        id: linkedMediaId,
        processId: DEMAND_ID,
        ownerType: 'avaria',
        ownerId: activeDamageId,
        blob: new Blob(['photo'], { type: 'image/jpeg' }),
        mimeType: 'image/jpeg',
        status: 'local',
        createdAt: new Date().toISOString(),
      },
      {
        id: orphanMediaId,
        processId: DEMAND_ID,
        ownerType: 'avaria',
        ownerId: 'missing-damage',
        blob: new Blob(['photo'], { type: 'image/jpeg' }),
        mimeType: 'image/jpeg',
        status: 'local',
        createdAt: new Date().toISOString(),
      },
      {
        id: deletedDamageMediaId,
        processId: DEMAND_ID,
        ownerType: 'avaria',
        ownerId: deletedDamageId,
        blob: new Blob(['photo'], { type: 'image/jpeg' }),
        mimeType: 'image/jpeg',
        status: 'local',
        createdAt: new Date().toISOString(),
      },
    ]);

    await recebimentoV2Db.damages.bulkPut([
      {
        id: activeDamageId,
        demandId: DEMAND_ID,
        sku: '600598361',
        description: 'Avaria ativa',
        quantity: 1,
        quantidadeCaixa: 1,
        quantidadeUnidade: 0,
        mediaIds: [linkedMediaId],
        registradoAt: new Date().toISOString(),
        syncStatus: 'synced',
        serverAvariaId: 'avaria-server-active',
        updatedAt: Date.now(),
      },
      {
        id: deletedDamageId,
        demandId: DEMAND_ID,
        sku: '600598362',
        description: 'Avaria removida',
        quantity: 1,
        quantidadeCaixa: 1,
        quantidadeUnidade: 0,
        mediaIds: [deletedDamageMediaId],
        registradoAt: new Date().toISOString(),
        syncStatus: 'synced',
        serverAvariaId: 'avaria-server-deleted',
        deletedAt: new Date().toISOString(),
        updatedAt: Date.now(),
      },
    ]);

    await expect(collectAvariaPhotoIds(DEMAND_ID)).resolves.toEqual([linkedMediaId]);
    await expect(hasPendingPhotoUploads(DEMAND_ID)).resolves.toBe(true);
  });

  it('resolveServerAvariaIdForDamage reads serverAvariaId from synced op payload', async () => {
    const damage: DamageRecord = {
      id: 'damage-local',
      demandId: DEMAND_ID,
      sku: '600598361',
      description: 'Avaria teste',
      quantity: 1,
      quantidadeCaixa: 1,
      quantidadeUnidade: 0,
      registradoAt: new Date().toISOString(),
      syncStatus: 'synced',
      updatedAt: Date.now(),
    };

    await recebimentoV2Db.syncOperations.put({
      id: crypto.randomUUID(),
      aggregateId: DEMAND_ID,
      module: 'damage',
      opType: RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {
        damageId: 'damage-local',
        serverAvariaId: 'avaria-server-3',
        tipo: '1',
        natureza: '1',
        causa: '1',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
      },
      attachmentIds: [],
      status: 'synced',
      attempts: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    await expect(resolveServerAvariaIdForDamage(damage)).resolves.toBe('avaria-server-3');
  });
});

describe('dismissPendingPhotos', () => {
  beforeEach(async () => {
    await recebimentoV2Db.damages.clear();
    await recebimentoV2Db.syncOperations.clear();
    await recebimentoV2Db.media.clear();
    await recebimentoV2Db.checklists.clear();
  });

  it('removes non-uploaded media and unlinks from damage and sync op', async () => {
    const mediaId = crypto.randomUUID();
    const damageId = crypto.randomUUID();
    const sku = '600598361';

    await recebimentoV2Db.media.put({
      id: mediaId,
      processId: DEMAND_ID,
      ownerType: 'avaria',
      ownerId: 'avaria-session-test',
      blob: new Blob(['photo'], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      status: 'error',
      createdAt: new Date().toISOString(),
    });

    await recebimentoV2Db.damages.put({
      id: damageId,
      demandId: DEMAND_ID,
      sku,
      description: 'Avaria teste',
      quantity: 1,
      quantidadeCaixa: 1,
      quantidadeUnidade: 0,
      mediaIds: [mediaId],
      registradoAt: new Date().toISOString(),
      syncStatus: 'synced',
      serverAvariaId: 'avaria-server-1',
      updatedAt: Date.now(),
    });

    const opId = crypto.randomUUID();
    await recebimentoV2Db.syncOperations.put({
      id: opId,
      aggregateId: DEMAND_ID,
      module: 'damage',
      opType: RECEBIMENTO_V2_OP_TYPES.AVARIA_REGISTRAR,
      sequence: 1,
      dependsOn: [],
      idempotencyKey: crypto.randomUUID(),
      payload: {
        damageId,
        mediaIds: [mediaId],
        photoCount: 1,
        tipo: '1',
        natureza: '1',
        causa: '1',
        quantidadeCaixas: 1,
        quantidadeUnidades: 0,
      },
      attachmentIds: [mediaId],
      status: 'synced',
      attempts: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    const removed = await dismissPendingPhotos(DEMAND_ID);

    expect(removed).toBe(1);
    expect(await recebimentoV2Db.media.get(mediaId)).toBeUndefined();

    const damage = await recebimentoV2Db.damages.get(damageId);
    expect(damage?.mediaIds).toBeUndefined();

    const op = await recebimentoV2Db.syncOperations.get(opId);
    expect(op?.attachmentIds).toEqual([]);
    expect((op?.payload as { mediaIds?: string[] }).mediaIds).toEqual([]);
    expect((op?.payload as { photoCount?: number }).photoCount).toBe(0);
  });
});
