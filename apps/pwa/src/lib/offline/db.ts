import Dexie, { type Table } from 'dexie';

import type { Demand as DevolucaoDemand } from '@/features/devolucao/types/devolucao.schema';
import type {
  DemandaDetalheCache,
  DevolucaoConferenciaRascunhoEntry,
} from '@/features/devolucao/types/devolucao.schema';
import type { InventoryDemand } from '@/features/estoque/types/estoque.schema';
import type { RecebimentoConferenciaRascunhoEntry } from '@/features/recebimento/lib/recebimento-conferencia-rascunho';
import type { SerializedConferenciaContext } from '@/features/recebimento/lib/map-conferencia-itens';
import type {
  DocaApi,
  ProdutoApi,
} from '@/features/recebimento/types/recebimento.api';
import type {
  AvariaRegistro,
  ChecklistForm,
  Demand,
  ParametrosRecebimentoConferencia,
} from '@/features/recebimento/types/recebimento.schema';

export type OutboxStatus = 'pending' | 'syncing' | 'error' | 'discarded';

export type OutboxMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OutboxEntry {
  id?: number;
  endpoint: string;
  method: OutboxMethod;
  payload: unknown;
  photoIds: number[];
  status: OutboxStatus;
  retries: number;
  errorMessage?: string;
  label: string;
  createdAt: number;
}

export interface PhotoEntry {
  id?: number;
  relatedId: string;
  blob: Blob;
  mimeType: string;
  uploadedUrl?: string;
  createdAt: number;
}

export interface SyncMeta {
  id: string;
  lastSyncAt: number | null;
  todaySyncedCount: number;
  todayDate: string;
}

export interface DemandContextEntry {
  demandId: string;
  context: SerializedConferenciaContext;
  cachedAt: number;
}

export interface UnitDocasEntry {
  unidadeId: string;
  docas: DocaApi[];
  cachedAt: number;
}

export interface ChecklistPhotoSlotDraft {
  slotId: string;
  photoIds: number[];
}

export interface ChecklistDraftEntry {
  demandId: string;
  form: ChecklistForm;
  dockId: string;
  dockLabel: string;
  photoSlots: ChecklistPhotoSlotDraft[];
  situacao: string;
  recebimentoId: string | null;
  responsavelId: number | null;
  unidadeId: string;
  createdAt: number;
}

export interface DemandProdutosEntry {
  demandId: string;
  produtos: ProdutoApi[];
  cachedAt: number;
}

export interface UnidadeConfigEntry {
  unidadeId: string;
  config: ParametrosRecebimentoConferencia;
  cachedAt: number;
}

export interface RecebimentoAvariaEntry {
  recebimentoId: string;
  avarias: AvariaRegistro[];
  cachedAt: number;
}

class AppDB extends Dexie {
  demands!: Table<Demand, string>;
  devolucaoDemands!: Table<DevolucaoDemand, string>;
  devolucaoDemandasDetalhes!: Table<DemandaDetalheCache, string>;
  devolucaoConferenciaRascunho!: Table<
    DevolucaoConferenciaRascunhoEntry,
    [string, string]
  >;
  recebimentoConferenciaRascunho!: Table<
    RecebimentoConferenciaRascunhoEntry,
    [string, string]
  >;
  inventoryDemands!: Table<InventoryDemand, string>;
  demandContexts!: Table<DemandContextEntry, string>;
  unitDocas!: Table<UnitDocasEntry, string>;
  checklistDrafts!: Table<ChecklistDraftEntry, string>;
  demandProdutos!: Table<DemandProdutosEntry, string>;
  unidadeConfigs!: Table<UnidadeConfigEntry, string>;
  recebimentoAvarias!: Table<RecebimentoAvariaEntry, string>;
  photos!: Table<PhotoEntry, number>;
  outbox!: Table<OutboxEntry, number>;
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super('kls-pwa-db');
    this.version(1).stores({
      demands: 'id, status, supplier',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(2)
      .stores({
        demands: 'id, status, supplier',
        photos: '++id, relatedId, createdAt',
        outbox: '++id, status, createdAt',
        syncMeta: 'id',
      })
      .upgrade(async (tx) => {
        await tx.table('demands').clear();
      });
    this.version(3)
      .stores({
        demands: 'id, status, supplier',
        photos: '++id, relatedId, createdAt',
        outbox: '++id, status, createdAt',
        syncMeta: 'id',
      })
      .upgrade(async (tx) => {
        await tx.table('demands').clear();
      });
    this.version(4).stores({
      demands: 'id, status, supplier',
      devolucaoDemands: 'id, status, supplier',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(5).stores({
      demands: 'id, status, supplier',
      devolucaoDemands: 'id, status, supplier',
      inventoryDemands: 'id, type, zone',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(6).stores({
      demands: 'id, routeId, status, supplier',
      devolucaoDemands: 'id, status, supplier',
      inventoryDemands: 'id, type, zone',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(7).stores({
      demands: 'id, routeId, status, supplier',
      devolucaoDemands: 'id, status, supplier',
      inventoryDemands: 'id, type, zone',
      demandContexts: 'demandId',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(8).stores({
      demands: 'id, routeId, status, supplier',
      devolucaoDemands: 'id, status, supplier',
      inventoryDemands: 'id, type, zone',
      demandContexts: 'demandId',
      unitDocas: 'unidadeId',
      checklistDrafts: 'demandId',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(9).stores({
      demands: 'id, routeId, status, supplier',
      devolucaoDemands: 'id, status, supplier',
      inventoryDemands: 'id, type, zone',
      demandContexts: 'demandId',
      unitDocas: 'unidadeId',
      checklistDrafts: 'demandId',
      demandProdutos: 'demandId',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(10).stores({
      demands: 'id, routeId, status, supplier',
      devolucaoDemands: 'id, status, supplier',
      devolucaoDemandasDetalhes: 'id, updatedAt, cachedAt',
      devolucaoConferenciaRascunho: '[demandId+itemId], demandId',
      inventoryDemands: 'id, type, zone',
      demandContexts: 'demandId',
      unitDocas: 'unidadeId',
      checklistDrafts: 'demandId',
      demandProdutos: 'demandId',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(11).stores({
      demands: 'id, routeId, status, supplier',
      devolucaoDemands: 'id, routeId, status, supplier',
      devolucaoDemandasDetalhes: 'id, updatedAt, cachedAt',
      devolucaoConferenciaRascunho: '[demandId+itemId], demandId',
      inventoryDemands: 'id, type, zone',
      demandContexts: 'demandId',
      unitDocas: 'unidadeId',
      checklistDrafts: 'demandId',
      demandProdutos: 'demandId',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(12).stores({
      demands: 'id, routeId, status, supplier',
      devolucaoDemands: 'id, routeId, status, supplier',
      devolucaoDemandasDetalhes: 'id, updatedAt, cachedAt',
      devolucaoConferenciaRascunho: '[demandId+itemId], demandId',
      recebimentoConferenciaRascunho: '[demandId+sku], demandId',
      inventoryDemands: 'id, type, zone',
      demandContexts: 'demandId',
      unitDocas: 'unidadeId',
      checklistDrafts: 'demandId',
      demandProdutos: 'demandId',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(13).stores({
      demands: 'id, routeId, status, supplier',
      devolucaoDemands: 'id, routeId, status, supplier',
      devolucaoDemandasDetalhes: 'id, updatedAt, cachedAt',
      devolucaoConferenciaRascunho: '[demandId+itemId], demandId',
      recebimentoConferenciaRascunho: '[demandId+sku], demandId',
      inventoryDemands: 'id, type, zone',
      demandContexts: 'demandId',
      unitDocas: 'unidadeId',
      checklistDrafts: 'demandId',
      demandProdutos: 'demandId',
      unidadeConfigs: 'unidadeId',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
    this.version(14).stores({
      demands: 'id, routeId, status, supplier',
      devolucaoDemands: 'id, routeId, status, supplier',
      devolucaoDemandasDetalhes: 'id, updatedAt, cachedAt',
      devolucaoConferenciaRascunho: '[demandId+itemId], demandId',
      recebimentoConferenciaRascunho: '[demandId+sku], demandId',
      inventoryDemands: 'id, type, zone',
      demandContexts: 'demandId',
      unitDocas: 'unidadeId',
      checklistDrafts: 'demandId',
      demandProdutos: 'demandId',
      unidadeConfigs: 'unidadeId',
      recebimentoAvarias: 'recebimentoId',
      photos: '++id, relatedId, createdAt',
      outbox: '++id, status, createdAt',
      syncMeta: 'id',
    });
  }
}

export const db = new AppDB();
