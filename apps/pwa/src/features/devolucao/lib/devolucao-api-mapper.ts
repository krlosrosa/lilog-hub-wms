import type { Demand, DemandStatus } from '../types/devolucao.schema';

export {
  mapDemandaDetalheToCache,
  mapItensToSkuItems,
} from '@/lib/offline/demand-detail-cache';

export type DemandaDevolucaoStatusApi =
  | 'rascunho'
  | 'aberta'
  | 'em_analise'
  | 'em_execucao'
  | 'conferida'
  | 'concluida'
  | 'cancelada';

export type DevolucaoNotaFiscalTipoApi =
  | 'reentrega'
  | 'devolucao_parcial'
  | 'devolucao_total';

export type DemandaDevolucaoApiItem = {
  id: string;
  codigoDemanda: string;
  status: DemandaDevolucaoStatusApi;
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
  concluidaAt: string | null;
  totalNfs: number;
  totalItens: number;
  pesoDevolvido: number;
  transporteId: string | null;
  placa: string | null;
  cliente: string | null;
  tiposNf: DevolucaoNotaFiscalTipoApi[];
  doca?: string | null;
  cargaSegregada?: boolean;
  paletesEsperados?: number | null;
};

export type ListarDemandasDevolucaoApiResponse = {
  demandas: DemandaDevolucaoApiItem[];
};

export const DEMANDA_DEVOLUCAO_STATUS_ABERTOS: readonly DemandaDevolucaoStatusApi[] =
  ['em_analise', 'em_execucao'] as const;

export const DEMAND_STATUS_LABELS: Record<DemandStatus, string> = {
  aguardando: 'Aguardando',
  em_conferencia: 'Em Conferência',
  concluido: 'Concluído',
};

const NF_TIPO_LABELS: Record<DevolucaoNotaFiscalTipoApi, string> = {
  reentrega: 'Reentrega',
  devolucao_parcial: 'Dev. Parcial',
  devolucao_total: 'Dev. Total',
};

function formatHorario(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function mapStatusToDemandStatus(status: DemandaDevolucaoStatusApi): DemandStatus {
  if (status === 'em_execucao') {
    return 'em_conferencia';
  }

  if (status === 'concluida' || status === 'conferida') {
    return 'concluido';
  }

  if (status === 'em_analise') {
    return 'aguardando';
  }

  return 'aguardando';
}

function resolveTagLabel(item: DemandaDevolucaoApiItem): string | undefined {
  const tipo = item.tiposNf[0];
  if (tipo) {
    return NF_TIPO_LABELS[tipo];
  }

  if (item.placa?.trim()) {
    return item.placa.trim();
  }

  return undefined;
}

export function isDemandaDevolucaoAberta(
  status: DemandaDevolucaoStatusApi,
): boolean {
  return DEMANDA_DEVOLUCAO_STATUS_ABERTOS.includes(status);
}

export function isChecklistDevolucaoPendente(input: {
  apiStatus?: DemandaDevolucaoStatusApi | null;
  demandStatus?: DemandStatus | null;
}): boolean {
  if (input.apiStatus != null) {
    return input.apiStatus === 'em_analise';
  }

  if (input.demandStatus != null) {
    return input.demandStatus === 'aguardando';
  }

  return false;
}

export function getDevolucaoDemandaEntryPath(_demand: Demand) {
  return '/devolucao/$id/itens' as const;
}

export function mergeDemandaComCacheLocal(
  demand: Demand,
  local?: Demand | null,
): Demand {
  if (!local) {
    return demand;
  }

  return {
    ...demand,
    dock: local.dock && local.dock !== '—' ? local.dock : demand.dock,
    paletesRecebidos: local.paletesRecebidos ?? demand.paletesRecebidos,
    paletesEsperados: local.paletesEsperados ?? demand.paletesEsperados,
    companies: local.companies?.length ? local.companies : demand.companies,
  };
}

function resolveCompanies(_item: DemandaDevolucaoApiItem): Demand['companies'] {
  return ['LDB'];
}

export function mapDemandaDevolucaoApiToDemand(
  item: DemandaDevolucaoApiItem,
  local?: Demand | null,
): Demand {
  const supplier =
    item.cliente?.trim() || item.codigoDemanda || 'Cliente não informado';

  const mapped: Demand = {
    id: item.codigoDemanda,
    routeId: item.id,
    supplier,
    dock: item.doca?.trim() || '—',
    arrival: formatHorario(item.createdAt),
    status: mapStatusToDemandStatus(item.status),
    companies: resolveCompanies(item),
    skuCount: item.totalItens,
    tagLabel: resolveTagLabel(item),
    tagVariant: item.status === 'em_execucao' ? 'error' : 'default',
    isPriority: item.status === 'em_execucao',
    pulse: item.status === 'em_execucao',
    cargaSegregada: item.cargaSegregada ?? false,
    paletesEsperados: item.paletesEsperados ?? undefined,
  };

  return mergeDemandaComCacheLocal(mapped, local);
}

export function mapDemandasDevolucaoAbertas(
  demandas: DemandaDevolucaoApiItem[],
  localByRouteId: Map<string, Demand> = new Map(),
): Demand[] {
  return demandas
    .filter((item) => isDemandaDevolucaoAberta(item.status))
    .map((item) =>
      mapDemandaDevolucaoApiToDemand(item, localByRouteId.get(item.id)),
    );
}
