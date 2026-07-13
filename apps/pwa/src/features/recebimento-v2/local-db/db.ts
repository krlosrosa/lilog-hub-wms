import Dexie, { type Table } from 'dexie';
import type {
  ChecklistRecord,
  ChecklistTemplateRecord,
  ConferenceRecord,
  DamageRecord,
  ImpedimentoRecord,
  DemandRecord,
  DocaRecord,
  ExpectedItemRecord,
  MediaRecord,
  ProcessRecord,
  ProductRecord,
  SyncBatchRecord,
  SyncConflictRecord,
  SyncCursorRecord,
  SyncIdMappingRecord,
  SyncLeaseRecord,
  SyncMetaRecord,
  SyncOperationRecord,
  TemperatureRecord,
  UnitConfigRecord,
} from './schema.js';

// ---------------------------------------------------------------------------
// Database class
// ---------------------------------------------------------------------------

const RECEBIMENTO_V2_STORES = {
  processes: 'id, unidadeId, status',
  demands: 'id, unidadeId, status, routeId',
  expectedItems: 'id, demandId, produtoId',
  conferences: 'id, demandId, sku, syncStatus, deletedAt',
  checklists: 'demandId, syncStatus',
  checklistTemplates: 'unidadeId',
  temperatures: 'id, demandId',
  damages: 'id, demandId, syncStatus, deletedAt',
  impedimentos: 'id, demandId, syncStatus',
  // Products: produtoId is PK; unidadeId + sku for filtered search
  products: 'produtoId, unidadeId, sku, ean, dum, empresa, deletedAt',
  docas: 'unidadeId',
  unitConfigs: 'unidadeId',
  media: 'id, processId, ownerType, ownerId, status',
  // syncOperations: id is a UUID string PK (not auto-increment)
  syncOperations: 'id, aggregateId, module, status, createdAt',
  syncBatches: 'id, aggregateId, status',
  syncIdMappings: 'clientId, aggregateId',
  syncCursors: 'id',
  syncConflicts: 'id, aggregateId, resolved',
  syncLeases: 'aggregateId',
  syncMeta: 'id',
} as const;

export class RecebimentoV2DB extends Dexie {
  processes!: Table<ProcessRecord, string>;
  demands!: Table<DemandRecord, string>;
  expectedItems!: Table<ExpectedItemRecord, string>;
  conferences!: Table<ConferenceRecord, string>;
  checklists!: Table<ChecklistRecord, string>;
  checklistTemplates!: Table<ChecklistTemplateRecord, string>;
  temperatures!: Table<TemperatureRecord, string>;
  damages!: Table<DamageRecord, string>;
  impedimentos!: Table<ImpedimentoRecord, string>;
  products!: Table<ProductRecord, string>;
  docas!: Table<DocaRecord, string>;
  unitConfigs!: Table<UnitConfigRecord, string>;
  media!: Table<MediaRecord, string>;
  syncOperations!: Table<SyncOperationRecord, string>;
  syncBatches!: Table<SyncBatchRecord, string>;
  syncIdMappings!: Table<SyncIdMappingRecord, string>;
  syncCursors!: Table<SyncCursorRecord, string>;
  syncConflicts!: Table<SyncConflictRecord, string>;
  syncLeases!: Table<SyncLeaseRecord, string>;
  syncMeta!: Table<SyncMetaRecord, string>;

  constructor() {
    super('lilog-recebimento-v2-db');

    this.version(1).stores(RECEBIMENTO_V2_STORES);
    // v2: garante criação de object stores ausentes em DBs criados durante o beta.
    this.version(2).stores(RECEBIMENTO_V2_STORES);
    // v3: reforça stores após adição de demands/checklist hydration no pull.
    this.version(3).stores(RECEBIMENTO_V2_STORES);
    this.version(4).stores(RECEBIMENTO_V2_STORES);
  }
}

export const recebimentoV2Db = new RecebimentoV2DB();

/** Aguarda migração/open do IndexedDB antes de transações. */
export async function ensureRecebimentoV2DbReady(): Promise<void> {
  await recebimentoV2Db.open();
}
