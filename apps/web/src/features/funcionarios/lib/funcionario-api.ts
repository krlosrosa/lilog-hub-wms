import { apiRequest } from '@/lib/api';

import type {
  CreateFuncionarioApiResponse,
  CreateFuncionarioPayload,
  FuncionarioApi,
  FuncionarioSituacaoApi,
  ListFuncionariosApiResponse,
  UpdateFuncionarioPayload,
} from '@/features/funcionarios/types/funcionario.api';
import { CARGO_LABELS } from '@/features/funcionarios/types/funcionarios-cadastro.schema';
import type {
  FuncionarioDepartamento,
  FuncionarioKpi,
  FuncionarioRecord,
  FuncionarioStatus,
  FuncionarioTurno,
} from '@/features/funcionarios/types/funcionarios-gestao.schema';

type ListFuncionariosParams = {
  page?: number;
  limit?: number;
  unidadeId?: string;
  cargo?: string;
  situacao?: FuncionarioSituacaoApi;
  search?: string;
};

function mapSituacaoToStatus(situacao: FuncionarioSituacaoApi): FuncionarioStatus {
  if (situacao === 'ativo') return 'ativo';
  return 'inativo';
}

function mapCargoToDepartamento(cargo: string): FuncionarioDepartamento {
  if (cargo.includes('receb')) return 'recebimento';
  if (cargo.includes('exped') || cargo.includes('carregador')) return 'expedicao';
  if (cargo.includes('estoqu') || cargo.includes('invent')) return 'estoque';
  if (cargo.includes('confer')) return 'qualidade';
  if (cargo.includes('supervisor')) return 'triagem';
  if (cargo.includes('manut')) return 'manutencao';
  if (cargo === 'administrativo') return 'logistica';
  if (cargo === 'ajudante') return 'expedicao';
  return 'logistica';
}

function formatCargoLabel(cargo: string): string {
  if (cargo in CARGO_LABELS) {
    return CARGO_LABELS[cargo as keyof typeof CARGO_LABELS];
  }

  return cargo.replaceAll('_', ' ');
}

export function mapFuncionarioToRecord(
  funcionario: FuncionarioApi,
): FuncionarioRecord {
  return {
    id: String(funcionario.id),
    matricula: funcionario.matricula,
    nome: funcionario.nome,
    cargo: formatCargoLabel(funcionario.cargo),
    departamento: mapCargoToDepartamento(funcionario.cargo),
    turno: 'manha' as FuncionarioTurno,
    produtividade: funcionario.situacao === 'ativo' ? 75 : 0,
    status: mapSituacaoToStatus(funcionario.situacao),
  };
}

export function buildFuncionarioKpi(
  funcionarios: FuncionarioApi[],
  total: number,
): FuncionarioKpi {
  const ativos = funcionarios.filter((item) => item.situacao === 'ativo').length;
  const produtividadeMedia =
    funcionarios.length > 0
      ? Math.round(
          funcionarios.reduce(
            (sum, item) => sum + (item.situacao === 'ativo' ? 75 : 0),
            0,
          ) / funcionarios.length,
        )
      : 0;

  return {
    totalFuncionarios: total,
    totalFuncionariosTrendPercent: 0,
    totalFuncionariosProgress: total > 0 ? Math.min(100, total) : 0,
    produtividadeMedia,
    produtividadeMediaTrendPercent: 0,
    produtividadeMediaProgress: produtividadeMedia,
    horarioMedioOperacao: '—',
    horarioMedioTrendPercent: 0,
    horarioMedioProgress: 0,
  };
}

export async function listFuncionarios(
  params: ListFuncionariosParams = {},
): Promise<ListFuncionariosApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.unidadeId) searchParams.set('unidadeId', params.unidadeId);
  if (params.cargo) searchParams.set('cargo', params.cargo);
  if (params.situacao) searchParams.set('situacao', params.situacao);
  if (params.search?.trim()) searchParams.set('search', params.search.trim());

  const query = searchParams.toString();
  const path = query ? `/funcionarios?${query}` : '/funcionarios';

  return apiRequest<ListFuncionariosApiResponse>(path);
}

export function createFuncionario(payload: CreateFuncionarioPayload) {
  return apiRequest<CreateFuncionarioApiResponse>('/funcionarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateFuncionario(id: number, payload: UpdateFuncionarioPayload) {
  return apiRequest<FuncionarioApi>(`/funcionarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function blockFuncionario(id: number) {
  return apiRequest<FuncionarioApi>(`/funcionarios/${id}/block`, {
    method: 'PATCH',
  });
}
