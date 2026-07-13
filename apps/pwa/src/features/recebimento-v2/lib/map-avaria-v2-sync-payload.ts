import type { DamageRecord } from '../local-db/schema';

export interface AvariaV2SyncPayload {
  damageId: string;
  produtoId?: string;
  lote?: string;
  tipo: string;
  natureza: string;
  causa: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  photoCount: number;
  skusAlvo?: string[];
  /** Preserved for UI/repair — not used by the API */
  sku?: string;
  /** Local media IDs — used for post-sync photo upload */
  mediaIds?: string[];
}

function isValidAvariaSyncPayload(payload: Record<string, unknown>): boolean {
  return (
    typeof payload.tipo === 'string' &&
    payload.tipo.length > 0 &&
    typeof payload.natureza === 'string' &&
    payload.natureza.length > 0 &&
    typeof payload.causa === 'string' &&
    payload.causa.length > 0 &&
    typeof payload.quantidadeCaixas === 'number' &&
    Number.isFinite(payload.quantidadeCaixas) &&
    typeof payload.quantidadeUnidades === 'number' &&
    Number.isFinite(payload.quantidadeUnidades)
  );
}

export function mapAvariaV2SyncPayload(
  record: DamageRecord,
  produtoId?: string,
): AvariaV2SyncPayload {
  const mediaIds = record.mediaIds ?? [];
  const quantidadeCaixas = record.quantidadeCaixa ?? 0;
  const quantidadeUnidades = record.quantidadeUnidade ?? 0;

  return {
    damageId: record.id,
    produtoId,
    lote: record.lote,
    tipo: record.tipo ?? record.motivo ?? '',
    natureza: record.natureza ?? '',
    causa: record.causa ?? '',
    quantidadeCaixas,
    quantidadeUnidades,
    photoCount: mediaIds.length,
    skusAlvo: record.sku ? [record.sku] : record.skusAlvo,
    sku: record.sku,
    mediaIds,
  };
}

export function isValidAvariaV2SyncPayload(
  payload: Record<string, unknown>,
): boolean {
  return isValidAvariaSyncPayload(payload);
}

export interface AvariaRemoverV2SyncPayload {
  damageId: string;
  avariaId: string;
}

export function mapAvariaRemoverV2SyncPayload(
  damageId: string,
  avariaId: string,
): AvariaRemoverV2SyncPayload {
  return {
    damageId,
    avariaId,
  };
}
