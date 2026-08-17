const STORAGE_PREFIX = 'recebimento-rc-palete:';

function storageKey(demandId: string): string {
  return `${STORAGE_PREFIX}${demandId}`;
}

export function getActivePaleteCodigoRc(demandId: string): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  return sessionStorage.getItem(storageKey(demandId));
}

export function setActivePaleteCodigoRc(demandId: string, codigo: string): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }

  sessionStorage.setItem(storageKey(demandId), codigo.trim());
}

export function generateUnitizadorCodigoRc(): string {
  return `PAL-${Date.now().toString(36).toUpperCase()}`;
}

export const PALETE_OBRIGATORIO_MSG_RC =
  'Informe o palete antes de conferir itens nesta demanda.';
