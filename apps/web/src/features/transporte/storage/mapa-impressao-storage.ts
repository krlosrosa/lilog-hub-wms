import type {
  ImpressaoPayload,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';
import {
  MAPA_IMPRESSAO_PAYLOAD_STORAGE_KEY,
  MAPA_SELECAO_STORAGE_KEY,
  MAPA_TRANSPORTES_STORAGE_KEY,
} from '@/features/transporte/types/transporte.schema';

export function saveMapaSelecao(ids: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.setItem(MAPA_SELECAO_STORAGE_KEY, JSON.stringify(ids));
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
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.setItem(
    MAPA_TRANSPORTES_STORAGE_KEY,
    JSON.stringify(transportes),
  );
}

export function loadMapaTransportes(): TransporteGrupo[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = sessionStorage.getItem(MAPA_TRANSPORTES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as TransporteGrupo[]) : [];
  } catch {
    return [];
  }
}

export function saveMapaImpressaoPayload(payload: ImpressaoPayload): void {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.setItem(
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
