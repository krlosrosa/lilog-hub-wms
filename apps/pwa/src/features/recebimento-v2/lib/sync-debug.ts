const DEBUG_PREFIX = '[recebimento-v2]';
export const RECEBIMENTO_V2_DEBUG_STORAGE_KEY = 'recebimento-v2:debug';
const DEBUG_STORAGE_KEY = RECEBIMENTO_V2_DEBUG_STORAGE_KEY;

let bootstrapped = false;

export function isRecebimentoV2DebugEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }

  if (typeof localStorage === 'undefined') {
    return false;
  }

  return localStorage.getItem(DEBUG_STORAGE_KEY) === '1';
}

export function setRecebimentoV2DebugEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  if (enabled) {
    localStorage.setItem(DEBUG_STORAGE_KEY, '1');
  } else {
    localStorage.removeItem(DEBUG_STORAGE_KEY);
  }
}

function ensureBootstrapLog(): void {
  if (bootstrapped || !isRecebimentoV2DebugEnabled()) {
    return;
  }

  bootstrapped = true;
  console.log(
    `${DEBUG_PREFIX} debug ativo — filtre o console por "recebimento-v2". Para forçar em build: localStorage.setItem("${DEBUG_STORAGE_KEY}", "1")`,
  );
}

export function debugRecebimentoV2(
  scope: string,
  message: string,
  data?: unknown,
): void {
  if (!isRecebimentoV2DebugEnabled()) {
    return;
  }

  ensureBootstrapLog();

  if (data !== undefined) {
    console.log(`${DEBUG_PREFIX}[${scope}] ${message}`, data);
    return;
  }

  console.log(`${DEBUG_PREFIX}[${scope}] ${message}`);
}

export function errorRecebimentoV2(
  scope: string,
  message: string,
  data?: unknown,
): void {
  if (!isRecebimentoV2DebugEnabled()) {
    return;
  }

  ensureBootstrapLog();

  if (data !== undefined) {
    console.error(`${DEBUG_PREFIX}[${scope}] ${message}`, data);
    return;
  }

  console.error(`${DEBUG_PREFIX}[${scope}] ${message}`);
}
