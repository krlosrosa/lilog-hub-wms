import type { LocalSyncOperation, ProcessStatus, SyncOperationStatus } from '@lilog/contracts';

import type { ParametrosRecebimentoConferencia } from '@/features/recebimento/types/recebimento.schema';

// ---------------------------------------------------------------------------
// Re-export core types
// ---------------------------------------------------------------------------
export type { ProcessStatus, SyncOperationStatus };

// ---------------------------------------------------------------------------
// Domain record types - shaped for local-first UI + sync engine
// ---------------------------------------------------------------------------

export interface DownloadProgress {
  completedSteps: string[];
  totalSteps: number;
  currentStep?: string;
}

export interface RecebimentoCapabilities {
  canEditChecklist: boolean;
  canRegistrarTemperatura: boolean;
  canFinalizar: boolean;
  canGerenciarPaletes: boolean;
  canConferirItens: boolean;
}

export interface ProcessRecord {
  id: string; // demandId (PK)
  unidadeId: string;
  adapter: 'recebimento-v2';
  status: ProcessStatus;
  serverRevision: number;
  baseRevision: number;
  packageVersion?: string;
  downloadProgress?: DownloadProgress;
  downloadedAt?: number;
  lastSyncedAt?: number;
  lastPullAt?: number;
  errorMessage?: string;
  flowVersion: 'v2';
  /** Server recebimento id — cached after sync for photo uploads */
  recebimentoId?: string;
  // Display helpers (populated from demand package)
  supplier?: string;
  dock?: string;
  arrival?: string;
  placa?: string;
  conferente?: string;
  atribuidoAMim?: boolean;
  souApoio?: boolean;
  papelDoUsuario?: 'responsavel' | 'apoio' | null;
  capabilities?: RecebimentoCapabilities;
  apoioAlocacaoId?: string;
  /** Sessão de palete ativa (bipado via Iniciar palete) */
  activePaleteCodigo?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DemandRecord {
  id: string; // PK
  unidadeId: string;
  routeId: string;
  fornecedorCodigo: string;
  fornecedorNome: string;
  status: string;
  situacao: string;
  dataPrevisaoEntrega: string;
  dataCriacao: string;
  serverRevision: number;
  updatedAt: number;
}

export interface ExpectedItemRecord {
  id: string; // `${demandId}::${produtoId}` (PK)
  demandId: string;
  produtoId: string;
  sku: string;
  descricao: string;
  quantidadeEsperada: number;
  unidadeMedida: string;
  /** Snapshot de unidadesPorCaixa para normalização offline */
  unidadesPorCaixa?: number;
  isNovo?: boolean;
  updatedAt: number;
}

// ConferenceRecord - aligned with what use-conferencia-v2 writes
export interface ConferenceRecord {
  id: string; // uuid (PK)
  demandId: string;
  sku: string;
  lote?: string;
  fabricacao?: string;
  validade?: string;
  quantity: number;
  recebidaCaixa?: number;
  recebidaUnidade?: number;
  peso?: number;
  etiquetaCodigo?: string;
  /** Código do unitizador/palete WMS vinculado à conferência */
  unitizadorCodigo?: string;
  conferidoAt: string; // ISO string
  syncStatus: SyncOperationStatus;
  /** ID da linha em itens_recebimento no servidor, preenchido após sync de ITEM_CONFERIR */
  serverItemId?: string;
  /** ID da pesagem individual (caixa PVAR) no servidor */
  serverPesagemId?: string;
  /** Cada registro representa 1 caixa de produto peso variável */
  isPvarBox?: boolean;
  deletedAt?: string; // ISO string
  updatedAt: number;
}

// ChecklistRecord - aligned with what use-checklist-v2 writes
export interface ChecklistPhotoMediaIds {
  lacre?: string[];
  bauFechado?: string[];
  bauAberto?: string[];
  extras?: string[];
}

export interface ChecklistRecord {
  demandId: string; // PK
  id: string; // uuid for sync reference
  dock: string;
  lacre: string;
  tempBau?: number;
  conditions: Record<string, boolean>;
  observacoes?: string;
  responsavelId?: number;
  photoMediaIds?: ChecklistPhotoMediaIds;
  savedAt: string; // ISO string
  syncStatus: SyncOperationStatus;
  /** ID do checklist no servidor */
  serverChecklistId?: string;
  /** Quantidade de fotos já enviadas no servidor */
  serverPhotoCount?: number;
  updatedAt: number;
}

export interface ChecklistTemplateRecord {
  unidadeId: string; // PK
  template: Record<string, unknown>;
  cachedAt: number;
}

// TemperatureRecord - aligned with what hooks write
export interface TemperatureRecord {
  id: string; // `${demandId}::${etapa}` (PK)
  demandId: string;
  etapa: string;
  temperatura: number;
  syncStatus: SyncOperationStatus;
  updatedAt: number;
}

export interface DamageRecord {
  id: string; // uuid (PK)
  demandId: string;
  sku?: string;
  description: string;
  quantity: number;
  motivo: string;
  tipo?: string;
  natureza?: string;
  causa?: string;
  lote?: string;
  quantidadeCaixa?: number;
  quantidadeUnidade?: number;
  mediaIds?: string[];
  registradoAt: string; // ISO string
  syncStatus: SyncOperationStatus;
  /** ID da avaria no servidor, preenchido após sync de AVARIA_REGISTRAR */
  serverAvariaId?: string;
  /** Avaria replicada para todos os itens conferidos */
  replicarParaTodos?: boolean;
  /** SKUs afetados quando replicarParaTodos = true */
  skusAlvo?: string[];
  deletedAt?: string; // ISO string
  updatedAt: number;
}

export interface ImpedimentoRecord {
  id: string;
  demandId: string;
  tipo: string;
  descricao: string;
  mediaIds?: string[];
  registradoAt: string;
  syncStatus: SyncOperationStatus;
  serverImpedimentoId?: string;
  updatedAt: number;
}

// ProductRecord - includes unidadeId for filtering and description for search
export interface ProductRecord {
  produtoId: string; // PK
  sku: string;
  description: string;  // normalized description for search
  unidadeId: string;    // for filtering by unit/company scope
  empresa: string;
  categoria: string;
  tipo: string;
  ean: string;
  dum: string;
  shelfLife: number;
  pesoBrutoUnidade: number;
  pesoBrutoCaixa: number;
  pesoBrutoPalete: number;
  pesoLiquidoUnidade: number;
  pesoLiquidoCaixa: number;
  pesoLiquidoPalete: number;
  unidadesPorCaixa: number;
  caixasPorPalete: number;
  controlaLote: boolean;
  controlaValidade: boolean;
  controlaPeso: boolean;
  pesoVariavel: boolean;
  serverRevision: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface DocaRecord {
  unidadeId: string; // PK
  docas: unknown[];
  cachedAt: number;
}

export interface UnitConfigRecord {
  unidadeId: string; // PK
  config: ParametrosRecebimentoConferencia;
  cachedAt: number;
}

export interface MediaRecord {
  id: string; // uuid (PK)
  processId: string;
  ownerType: 'checklist' | 'avaria' | 'impedimento' | 'documento';
  ownerId: string;
  blob: Blob;
  mimeType: string;
  checksum?: string;
  filename?: string;
  status: 'local' | 'uploading' | 'uploaded' | 'error';
  remoteUrl?: string;
  uploadedAt?: string;
  createdAt: string;
}

// SyncOperationRecord - matches LocalSyncOperation from @lilog/contracts + extra fields
export interface SyncOperationRecord extends LocalSyncOperation {
  errorMessage?: string;
}

export interface SyncBatchRecord {
  id: string; // uuid (batchId, PK)
  batchId: string;
  aggregateId: string;
  adapter: string;
  baseRevision: number;
  serverRevision?: number;
  status: 'pending' | 'sent' | 'applied' | 'conflict' | 'error';
  appliedCount: number;
  skippedCount: number;
  errorCount: number;
  createdAt: number;
  completedAt?: number;
}

export interface SyncIdMappingRecord {
  clientId: string; // PK
  serverId: string;
  aggregateId: string;
  entityType: string;
  createdAt: number;
}

export interface SyncCursorRecord {
  id: string; // cursorKey (PK)
  cursor: string;
  lastSyncedAt: number;
}

export interface SyncConflictRecord {
  id: string; // uuid (PK)
  aggregateId: string;
  batchId: string;
  serverRevision: number;
  localRevision: number;
  sections: string[];
  serverSnapshot?: unknown;
  resolved: boolean;
  resolvedAt?: number;
  createdAt: number;
}

export interface SyncLeaseRecord {
  aggregateId: string; // PK
  deviceId: string;
  acquiredAt: number;
  expiresAt: number;
}

export interface SyncMetaRecord {
  id: string; // PK
  value: unknown;
  updatedAt: number;
}
