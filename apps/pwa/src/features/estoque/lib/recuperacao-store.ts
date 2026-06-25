import {
  getRecuperacaoDemandaById,
  getRecuperacaoItensByDemandaId,
  SEED_RECUPERACAO_DEMANDS,
  SEED_RECUPERACAO_ITENS,
} from '../data/recuperacao-seed';
import type {
  RecuperacaoDemanda,
  RecuperacaoDemandaStatus,
  RecuperacaoExecucaoRegistro,
  RecuperacaoItem,
  RecuperacaoItemStatus,
  RecuperacaoResumo,
} from '../types/recuperacao.schema';
export interface ScanState {
  enderecoValidado: boolean;
  skuValidado: boolean;
}

const EMPTY_SCAN_STATE: ScanState = {
  enderecoValidado: false,
  skuValidado: false,
};

type SnapshotCache<T> = { version: number; value: T };

const snapshotCaches = new Map<string, SnapshotCache<unknown>>();

interface DemandaSession {
  iniciadoEm: number;
  finalizadoEm?: number;
}

const demandasStore = new Map<string, RecuperacaoDemanda>();
const itensStore = new Map<string, RecuperacaoItem>();
const execucoesStore = new Map<string, RecuperacaoExecucaoRegistro>();
const scansStore = new Map<string, ScanState>();
const sessionsStore = new Map<string, DemandaSession>();

let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  snapshotCaches.clear();
  listeners.forEach((listener) => listener());
}

function getCachedSnapshot<T>(key: string, compute: () => T): T {
  const cached = snapshotCaches.get(key) as SnapshotCache<T> | undefined;
  if (cached && cached.version === version) {
    return cached.value;
  }

  const value = compute();
  snapshotCaches.set(key, { version, value });
  return value;
}

function cloneDemanda(demanda: RecuperacaoDemanda): RecuperacaoDemanda {
  return { ...demanda };
}

function cloneItem(item: RecuperacaoItem): RecuperacaoItem {
  return {
    ...item,
    fotosAntes: item.fotosAntes.map((foto) => ({ ...foto })),
  };
}

function ensureInitialized() {
  if (demandasStore.size === 0) {
    for (const demanda of SEED_RECUPERACAO_DEMANDS) {
      demandasStore.set(demanda.id, cloneDemanda(demanda));
    }
    for (const item of SEED_RECUPERACAO_ITENS) {
      itensStore.set(item.id, cloneItem(item));
    }
  }
}

function scanKey(demandaId: string, itemId: string) {
  return `${demandaId}:${itemId}`;
}

function getItensByDemandaRaw(demandaId: string): RecuperacaoItem[] {
  ensureInitialized();
  return Array.from(itensStore.values()).filter(
    (item) => item.demandaId === demandaId,
  );
}

function calcProgressoPercent(demandaId: string): number {
  const itens = getItensByDemandaRaw(demandaId);
  if (itens.length === 0) return 0;
  const concluidos = itens.filter((i) => i.status === 'concluido').length;
  return Math.round((concluidos / itens.length) * 100);
}

export function subscribeRecuperacao(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecuperacaoVersion() {
  return version;
}

export function getAllDemandas(): RecuperacaoDemanda[] {
  return getCachedSnapshot('all-demandas', () => {
    ensureInitialized();
    return Array.from(demandasStore.values()).map(cloneDemanda);
  });
}

export function getDemanda(demandaId: string): RecuperacaoDemanda | undefined {
  return getCachedSnapshot(`demanda:${demandaId}`, () => {
    ensureInitialized();
    const demanda = demandasStore.get(demandaId);
    return demanda ? cloneDemanda(demanda) : undefined;
  });
}

export function getItensByDemanda(demandaId: string): RecuperacaoItem[] {
  return getCachedSnapshot(`itens:${demandaId}`, () => {
    ensureInitialized();
    return getItensByDemandaRaw(demandaId).map(cloneItem);
  });
}

export function getItem(itemId: string): RecuperacaoItem | undefined {
  return getCachedSnapshot(`item:${itemId}`, () => {
    ensureInitialized();
    const item = itensStore.get(itemId);
    return item ? cloneItem(item) : undefined;
  });
}

export function getScanState(demandaId: string, itemId: string): ScanState {
  return getCachedSnapshot(`scan:${demandaId}:${itemId}`, () => {
    return scansStore.get(scanKey(demandaId, itemId)) ?? EMPTY_SCAN_STATE;
  });
}

export function getExecucao(
  itemId: string,
): RecuperacaoExecucaoRegistro | undefined {
  return getCachedSnapshot(`execucao:${itemId}`, () => {
    const registro = execucoesStore.get(itemId);
    return registro ? { ...registro } : undefined;
  });
}

function updateDemandaStatus(
  demandaId: string,
  status: RecuperacaoDemandaStatus,
) {
  const demanda = demandasStore.get(demandaId);
  if (!demanda) return;
  demandasStore.set(demandaId, {
    ...demanda,
    status,
    progressoPercent: calcProgressoPercent(demandaId),
  });
}

function updateItemStatus(itemId: string, status: RecuperacaoItemStatus) {
  const item = itensStore.get(itemId);
  if (!item) return;
  itensStore.set(itemId, { ...item, status });
}

export function iniciarDemanda(demandaId: string) {
  ensureInitialized();
  const demanda = demandasStore.get(demandaId);
  if (!demanda || demanda.status === 'finalizada') return;

  if (demanda.status === 'pendente') {
    updateDemandaStatus(demandaId, 'em_execucao');
    sessionsStore.set(demandaId, { iniciadoEm: Date.now() });
  }

  notify();
}

export function iniciarItem(demandaId: string, itemId: string) {
  ensureInitialized();
  iniciarDemanda(demandaId);
  updateItemStatus(itemId, 'em_execucao');
  notify();
}

export function validarScanEndereco(
  demandaId: string,
  itemId: string,
  codigo: string,
): boolean {
  const item = itensStore.get(itemId);
  if (!item) return false;

  const valido =
    codigo.trim().toUpperCase() === item.enderecoEsperado.toUpperCase();
  if (valido) {
    const key = scanKey(demandaId, itemId);
    const current = getScanState(demandaId, itemId);
    scansStore.set(key, { ...current, enderecoValidado: true });
    notify();
  }
  return valido;
}

export function validarScanSku(
  demandaId: string,
  itemId: string,
  codigo: string,
): boolean {
  const item = itensStore.get(itemId);
  if (!item) return false;

  const valido = codigo.trim().toUpperCase() === item.sku.toUpperCase();
  if (valido) {
    const key = scanKey(demandaId, itemId);
    const current = getScanState(demandaId, itemId);
    scansStore.set(key, { ...current, skuValidado: true });
    notify();
  }
  return valido;
}

export function registrarExecucao(
  registro: RecuperacaoExecucaoRegistro,
): boolean {
  ensureInitialized();
  const item = itensStore.get(registro.itemId);
  if (!item) return false;

  execucoesStore.set(registro.itemId, { ...registro });
  updateItemStatus(registro.itemId, 'concluido');

  const demandaId = registro.demandaId;
  const itens = getItensByDemandaRaw(demandaId);
  const todosConcluidos = itens.every((i) => i.status === 'concluido');

  const demanda = demandasStore.get(demandaId);
  if (demanda) {
    demandasStore.set(demandaId, {
      ...demanda,
      progressoPercent: calcProgressoPercent(demandaId),
      status: todosConcluidos ? 'finalizada' : 'em_execucao',
    });
  }

  if (todosConcluidos) {
    const session = sessionsStore.get(demandaId);
    if (session) {
      sessionsStore.set(demandaId, {
        ...session,
        finalizadoEm: Date.now(),
      });
    }
  }

  notify();
  return todosConcluidos;
}

export function buildResumo(demandaId: string): RecuperacaoResumo | null {
  ensureInitialized();
  const demanda = demandasStore.get(demandaId);
  if (!demanda) return null;

  const itens = getItensByDemanda(demandaId);
  const execucoes = itens
    .map((item) => execucoesStore.get(item.id))
    .filter((e): e is RecuperacaoExecucaoRegistro => Boolean(e));

  const totalUnidades = itens.reduce(
    (sum, item) => sum + item.quantidadeRecuperar,
    0,
  );
  const totalRecuperado = execucoes.reduce(
    (sum, e) => sum + e.qtyRecuperada,
    0,
  );
  const eficienciaPercent =
    totalUnidades > 0
      ? Math.round((totalRecuperado / totalUnidades) * 1000) / 10
      : 0;

  const session = sessionsStore.get(demandaId);
  const tempoGastoMinutos = session
    ? Math.max(
        1,
        Math.round(
          ((session.finalizadoEm ?? Date.now()) - session.iniciadoEm) / 60000,
        ),
      )
    : 12;

  const primeiroItem = itens[0];
  const ultimaExecucao = execucoes[execucoes.length - 1];

  return {
    demandaId,
    totalSkus: itens.length,
    totalUnidades,
    totalRecuperado,
    eficienciaPercent,
    tempoGastoMinutos,
    fotoAntesUrl: primeiroItem?.fotosAntes[0]?.url,
    fotoDepoisUrl: ultimaExecucao?.fotoDepoisUrl,
  };
}

export function resetRecuperacaoStore() {
  demandasStore.clear();
  itensStore.clear();
  execucoesStore.clear();
  scansStore.clear();
  sessionsStore.clear();
  snapshotCaches.clear();
  notify();
}

export function seedExists(demandaId: string) {
  return Boolean(getRecuperacaoDemandaById(demandaId));
}
