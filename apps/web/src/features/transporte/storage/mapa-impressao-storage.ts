import type {
  ImpressaoPayload,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';
import {
  MAPA_IMPRESSAO_PAYLOAD_STORAGE_KEY,
  MAPA_SELECAO_STORAGE_KEY,
  MAPA_TRANSPORTES_STORAGE_KEY,
} from '@/features/transporte/types/transporte.schema';

/**
 * Transportes completos (remessas + itens) excedem a quota do sessionStorage (~5 MB).
 * Mantemos os dados na memória da aba; IDs persistem via `saveMapaSelecao`.
 */
let mapaTransportesMemoryCache: TransporteGrupo[] = [];

function purgeLegacyMapaTransportesStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(MAPA_TRANSPORTES_STORAGE_KEY);
  } catch {
    // Quota já estourada — ignorar.
  }
}

purgeLegacyMapaTransportesStorage();

function setSessionStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem(key, value);
  } catch {
    // QuotaExceededError — dados menores (ids/config) podem falhar se o storage estiver cheio.
  }
}

export function saveMapaSelecao(ids: string[]): void {
  setSessionStorageItem(MAPA_SELECAO_STORAGE_KEY, JSON.stringify(ids));
}

export function loadMapaSelecao(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = sessionStorage.getItem(MAPA_SELECAO_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export function saveMapaTransportes(transportes: TransporteGrupo[]): void {
  mapaTransportesMemoryCache = transportes;
}

export function loadMapaTransportes(): TransporteGrupo[] {
  return mapaTransportesMemoryCache;
}

export function saveMapaImpressaoPayload(payload: ImpressaoPayload): void {
  setSessionStorageItem(
    MAPA_IMPRESSAO_PAYLOAD_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

export function loadMapaImpressaoPayload(): ImpressaoPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = sessionStorage.getItem(MAPA_IMPRESSAO_PAYLOAD_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ImpressaoPayload;
  } catch {
    return null;
  }
}
