import { apiRequest } from '@/lib/api';

import type {
  DemandaContagemItem,
  DemandaNovaFullFormValues,
  InventarioKpi,
  InventarioListaItem,
  InventarioStatus,
  InventarioTipo,
  TrendMes,
} from '@/features/inventario/types/inventario-lista.schema';
import type { InventarioCadastroFormValues } from '@/features/inventario/types/inventario-cadastro.schema';
import type { ResponsavelGestorOption } from '@/features/inventario/types/inventario-cadastro.schema';
import type { DemandaProgressoItem } from '@/features/inventario/types/inventario-detalhe.schema';
import type {
  DivergenciaItem,
  RecontagemAtual,
} from '@/features/inventario/types/inventario-detalhe.schema';

const OPEN_RECONTAGEM_STATUSES = ['aguardando_inicio', 'em_andamento'] as const;

function isRecontagemAberta(
  recontagem: RecontagemAtual | null | undefined,
): boolean {
  if (!recontagem) {
    return false;
  }

  return OPEN_RECONTAGEM_STATUSES.includes(
    recontagem.demandaStatus as (typeof OPEN_RECONTAGEM_STATUSES)[number],
  );
}

export type InventarioApi = {
  id: string;
  codigo: string;
  nome: string;
  tipo: InventarioTipo;
  status: 'agendado' | 'em_progresso' | 'pausado' | 'concluido';
  dataProgramada: string;
  centroId: string;
  responsavelGestorId: number | null;
  responsavelGestorNome: string | null;
};

export type InventarioDetalheApi = InventarioApi & {
  progressoPercent: number;
  itensContados: number;
  itensTotal: number;
  acuraciaPercent: number | null;
  divergenciasCount: number;
  ajustesPendentesCount: number;
  startedAt: string | null;
  setoresProgresso: Array<{
    id: string;
    nome: string;
    progressPercent: number;
    skuContados: number;
    skuTotal: number;
  }>;
  divergencias: Array<{
    id: string;
    contagemId: string;
    sku: string;
    produtoNome: string;
    setor: string;
    endereco: string;
    esperadoLabel: string;
    encontradoLabel: string;
    diferencaLabel: string;
    tipo: 'falta' | 'sobra';
    enderecoVazio: boolean;
    anomaliaEncontrada: boolean;
    pendenteAjuste: boolean;
  }>;
};

export type DivergenciaInventarioApi = {
  id: string;
  inventarioId: string;
  contagemId: string | null;
  enderecoId: string;
  enderecoMascarado: string;
  zona: string;
  saldoEnderecoId: string | null;
  depositoId: string | null;
  produtoId: string | null;
  sku: string;
  produtoNome: string;
  quantidadeEsperada: number;
  quantidadeContada: number;
  delta: number;
  unidadeMedida: string | null;
  lote: string | null;
  tipo: 'falta' | 'sobra' | 'endereco_vazio' | 'anomalia';
  status: 'pendente' | 'aprovada' | 'reprovada' | 'aplicada';
  aprovadaPor: number | null;
  aprovadaEm: string | null;
  motivoAprovacao: string | null;
  reprovadaPor: number | null;
  reprovadaEm: string | null;
  motivoReprovacao: string | null;
  documentoRef: string;
  recontagemAtual: RecontagemAtual | null;
  createdAt: string;
  updatedAt: string;
};

export type DemandaContagemApi = {
  id: string;
  inventarioId: string;
  nome: string;
  tipo: 'cega' | 'validacao';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'aguardando_inicio' | 'em_andamento' | 'concluida' | 'cancelada';
  responsavelId: number;
  responsavelNome: string;
  ativo: boolean;
  filtros: {
    enderecoIds: string[];
    zonas: string[];
    rackInicio?: string;
    rackFim?: string;
    categorias: string[];
    skuBusca?: string;
  };
  observacoes: string;
  alertaFragilidade: boolean;
  totalEnderecos: number;
  enderecosConferidos: number;
};

function mapStatusToUi(
  status: InventarioApi['status'],
): InventarioStatus {
  if (status === 'em_progresso') return 'em-progresso';
  if (status === 'concluido') return 'concluido';
  return 'agendado';
}

function formatDataLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return `Hoje, ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function mapInventarioToListaItem(
  item: InventarioApi,
): InventarioListaItem {
  return {
    id: item.id,
    codigo: item.codigo,
    dataLabel: formatDataLabel(item.dataProgramada),
    responsavelNome: item.responsavelGestorNome ?? '—',
    responsavelIniciais: item.responsavelGestorNome
      ? initialsFromName(item.responsavelGestorNome)
      : '—',
    tipo: item.tipo,
    acuraciaPercent: null,
    status: mapStatusToUi(item.status),
    destaque: item.status === 'em_progresso',
  };
}

export function mapDemandaToUiItem(item: DemandaContagemApi): DemandaContagemItem {
  const rackLabel =
    item.filtros.rackInicio || item.filtros.rackFim
      ? `Racks ${item.filtros.rackInicio || '—'} até ${item.filtros.rackFim || '—'}`
      : '—';

  const enderecoCount = item.totalEnderecos;
  const zonasLabel =
    item.filtros.zonas.length > 0
      ? item.filtros.zonas.join(', ')
      : `${enderecoCount} endereço(s)`;

  return {
    id: item.id,
    localTitulo: zonasLabel,
    localSubtitulo: rackLabel,
    responsavelNome: item.responsavelNome,
    tipo: item.tipo,
    status:
      item.status === 'aguardando_inicio' ? 'aguardando-inicio' : 'aguardando-inicio',
    iconName: item.tipo === 'cega' ? 'grid' : 'snow',
  };
}

export function mapDemandaToProgressoItem(
  item: DemandaContagemApi,
): DemandaProgressoItem {
  const progressPercent =
    item.totalEnderecos > 0
      ? Math.min(
          100,
          Math.round((item.enderecosConferidos / item.totalEnderecos) * 100),
        )
      : item.status === 'concluida'
        ? 100
        : 0;

  return {
    id: item.id,
    nome: item.nome,
    tipo: item.tipo,
    prioridade: item.prioridade,
    status: item.status,
    responsavelNome: item.responsavelNome,
    totalEnderecos: item.totalEnderecos,
    enderecosConferidos: item.enderecosConferidos,
    progressPercent,
    ativo: item.ativo,
  };
}

export async function listInventarios(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search?.trim()) searchParams.set('search', params.search.trim());

  const query = searchParams.toString();
  const path = query ? `/inventarios?${query}` : '/inventarios';

  return apiRequest<{
    items: InventarioApi[];
    total: number;
    page: number;
    limit: number;
  }>(path);
}

export function getInventarioKpi() {
  return apiRequest<InventarioKpi>('/inventarios/kpi');
}

export function getInventarioTrend() {
  return apiRequest<TrendMes[]>('/inventarios/trend');
}

export function getInventario(id: string) {
  return apiRequest<InventarioDetalheApi>(`/inventarios/${encodeURIComponent(id)}`);
}

export function listDivergenciasInventario(inventarioId: string) {
  return apiRequest<{ items: DivergenciaInventarioApi[] }>(
    `/inventarios/${encodeURIComponent(inventarioId)}/divergencias`,
  );
}

export function mapDivergenciaApiToItem(
  item: DivergenciaInventarioApi,
): DivergenciaItem {
  const recontagemAberta = isRecontagemAberta(item.recontagemAtual);

  return {
    id: item.id,
    sku: item.sku,
    produtoNome: item.produtoNome,
    setor: item.zona,
    endereco: item.enderecoMascarado,
    esperadoLabel: String(item.quantidadeEsperada),
    encontradoLabel: String(item.quantidadeContada),
    diferencaLabel:
      item.delta > 0 ? `+${item.delta}` : String(item.delta),
    tipo: item.tipo,
    status: item.status,
    recontagemAtual: item.recontagemAtual,
    podeAprovar: item.status === 'pendente' && !recontagemAberta,
    podeRecontar: item.status === 'pendente' && !recontagemAberta,
  };
}

export function aprovarDivergenciaInventario(
  inventarioId: string,
  divergenciaId: string,
  payload?: { motivoAprovacao?: string },
) {
  return apiRequest<DivergenciaInventarioApi>(
    `/inventarios/${encodeURIComponent(inventarioId)}/divergencias/${encodeURIComponent(divergenciaId)}/aprovar`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload ?? {}),
    },
  );
}

export function reprovarDivergenciaInventario(
  inventarioId: string,
  divergenciaId: string,
  payload: { motivoReprovacao: string },
) {
  return apiRequest<DivergenciaInventarioApi>(
    `/inventarios/${encodeURIComponent(inventarioId)}/divergencias/${encodeURIComponent(divergenciaId)}/reprovar`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function solicitarRecontagemDivergenciaInventario(
  inventarioId: string,
  divergenciaId: string,
  payload: {
    responsavelId: number;
    prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
    motivo?: string;
  },
) {
  return apiRequest<DivergenciaInventarioApi>(
    `/inventarios/${encodeURIComponent(inventarioId)}/divergencias/${encodeURIComponent(divergenciaId)}/recontagens`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function createInventario(payload: InventarioCadastroFormValues) {
  return apiRequest<InventarioApi>('/inventarios', {
    method: 'POST',
    body: JSON.stringify({
      nome: payload.nome,
      tipo: payload.tipo,
      dataProgramada: payload.dataProgramada,
      centroId: payload.centroId,
      responsavelGestorId: payload.responsavelGestorId
        ? Number(payload.responsavelGestorId)
        : undefined,
    }),
  });
}

export function updateInventarioStatus(
  id: string,
  status: 'pausado' | 'em_progresso' | 'concluido',
) {
  return apiRequest<InventarioApi>(`/inventarios/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function iniciarInventario(id: string) {
  return apiRequest<InventarioApi>(
    `/inventarios/${encodeURIComponent(id)}/iniciar`,
    { method: 'POST' },
  );
}

export function listDemandas(inventarioId: string) {
  return apiRequest<DemandaContagemApi[]>(
    `/inventarios/${encodeURIComponent(inventarioId)}/demandas`,
  );
}

export function createDemanda(
  inventarioId: string,
  payload: DemandaNovaFullFormValues,
) {
  return apiRequest<DemandaContagemApi>(
    `/inventarios/${encodeURIComponent(inventarioId)}/demandas`,
    {
      method: 'POST',
      body: JSON.stringify({
        nome: payload.nome,
        tipo: payload.tipo,
        prioridade: payload.prioridade,
        ativo: payload.statusAtivo,
        responsavelId: Number(payload.responsavelId),
        filtros: {
          enderecoIds: payload.enderecoIds,
          zonas: payload.zonas,
          rackInicio: payload.rackInicio || undefined,
          rackFim: payload.rackFim || undefined,
          skuBusca: payload.skuBusca || undefined,
        },
        observacoes: payload.observacoes,
        alertaFragilidade: payload.alertaFragilidade,
      }),
    },
  );
}

export function deleteDemanda(inventarioId: string, demandaId: string) {
  return apiRequest<void>(
    `/inventarios/${encodeURIComponent(inventarioId)}/demandas/${encodeURIComponent(demandaId)}`,
    { method: 'DELETE' },
  );
}

export function listZonas(unidadeId?: string) {
  const path = unidadeId
    ? `/enderecos/zonas?unidadeId=${encodeURIComponent(unidadeId)}`
    : '/enderecos/zonas';
  return apiRequest<Array<{ zona: string }>>(path);
}

export function listRuas(params?: { unidadeId?: string; zona?: string }) {
  const searchParams = new URLSearchParams();

  if (params?.unidadeId) {
    searchParams.set('unidadeId', params.unidadeId);
  }

  if (params?.zona?.trim()) {
    searchParams.set('zona', params.zona.trim());
  }

  const query = searchParams.toString();
  const path = query ? `/enderecos/ruas?${query}` : '/enderecos/ruas';
  return apiRequest<Array<{ rua: string }>>(path);
}

export function listOperators() {
  return apiRequest<ResponsavelGestorOption[]>('/users/operators');
}
