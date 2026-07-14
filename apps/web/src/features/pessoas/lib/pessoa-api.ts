import { apiRequest } from '@/lib/api';

import { FUNCIONARIO_CARGO_LABELS } from '@lilog/contracts';
import { createUser, updateUser } from '@/features/usuarios/lib/usuario-api';
import type { UserRoleApi } from '@/features/usuarios/types/usuario.api';
import {
  createFuncionario,
  updateFuncionario,
} from '@/features/funcionarios/lib/funcionario-api';
import type {
  BulkImportPayload,
  BulkImportResult,
  CreateFuncionarioApiResponse,
  CreatePessoaPayload,
  ListPessoasApiResponse,
  PessoaApi,
  UpdatePessoaPayload,
} from '@/features/pessoas/types/pessoa.api';
import type {
  PessoaAcessoUi,
  PessoaKpi,
  PessoaPerfil,
  PessoaRecord,
  PessoaSituacaoUi,
} from '@/features/pessoas/types/pessoa.schema';

type ListPessoasParams = {
  page?: number;
  limit?: number;
  unidadeId?: string;
  situacao?: string;
  cargo?: string;
  search?: string;
  temAcesso?: boolean;
  equipeId?: string;
  semEquipe?: boolean;
  funcionarioId?: number;
};

function mapRoleApiToPerfil(role: UserRoleApi | null): PessoaPerfil | null {
  if (!role) return null;
  if (role === 'admin') return 'admin';
  if (role === 'leader' || role === 'manager') return 'lider';
  return 'operador';
}

function mapPerfilToRoleApi(perfil: PessoaPerfil): UserRoleApi {
  if (perfil === 'admin') return 'admin';
  if (perfil === 'lider') return 'leader';
  return 'operator';
}

function mapSituacaoToUi(situacao: PessoaApi['situacao']): PessoaSituacaoUi {
  if (situacao === 'ativo') return 'ativo';
  if (situacao === 'bloqueado') return 'bloqueado';
  return 'inativo';
}

function mapAcessoToUi(pessoa: PessoaApi): PessoaAcessoUi {
  if (!pessoa.userId) return 'sem_acesso';
  if (pessoa.userStatus === 'ativo') return 'ativo';
  if (pessoa.userStatus === 'bloqueado') return 'bloqueado';
  if (pessoa.userStatus === 'pendente') return 'pendente';
  return 'inativo';
}

function formatCargoLabel(cargo: string): string {
  if (cargo in FUNCIONARIO_CARGO_LABELS) {
    return FUNCIONARIO_CARGO_LABELS[cargo as keyof typeof FUNCIONARIO_CARGO_LABELS];
  }

  return cargo.replaceAll('_', ' ');
}

export function mapPessoaToRecord(pessoa: PessoaApi): PessoaRecord {
  return {
    id: String(pessoa.funcionarioId),
    funcionarioId: pessoa.funcionarioId,
    matricula: pessoa.matricula,
    nome: pessoa.nome,
    cargo: formatCargoLabel(pessoa.cargo),
    situacao: mapSituacaoToUi(pessoa.situacao),
    unidadeId: pessoa.unidadeId,
    equipeId: pessoa.equipeId,
    equipeNome: pessoa.equipeNome,
    acesso: mapAcessoToUi(pessoa),
    perfil: mapRoleApiToPerfil(pessoa.userRole),
    userId: pessoa.userId,
  };
}

export function buildPessoaKpi(pessoas: PessoaApi[], total: number): PessoaKpi {
  const ativosOperacionais = pessoas.filter((p) => p.situacao === 'ativo').length;
  const comAcesso = pessoas.filter((p) => p.userId !== null).length;
  const bloqueados = pessoas.filter(
    (p) => p.userStatus === 'bloqueado' || p.situacao === 'bloqueado',
  ).length;

  return {
    total,
    ativosOperacionais,
    comAcesso,
    bloqueados,
  };
}

export async function listPessoas(
  params: ListPessoasParams = {},
): Promise<ListPessoasApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.unidadeId) searchParams.set('unidadeId', params.unidadeId);
  if (params.situacao) searchParams.set('situacao', params.situacao);
  if (params.cargo) searchParams.set('cargo', params.cargo);
  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.funcionarioId) {
    searchParams.set('funcionarioId', String(params.funcionarioId));
  }
  if (params.temAcesso !== undefined) {
    searchParams.set('temAcesso', String(params.temAcesso));
  }
  if (params.equipeId) {
    searchParams.set('equipeId', params.equipeId);
  }
  if (params.semEquipe !== undefined) {
    searchParams.set('semEquipe', String(params.semEquipe));
  }

  const query = searchParams.toString();
  const path = query ? `/pessoas?${query}` : '/pessoas';

  return apiRequest<ListPessoasApiResponse>(path);
}

export async function createPessoa(
  payload: CreatePessoaPayload,
): Promise<CreateFuncionarioApiResponse> {
  const basePayload = {
    unidadeId: payload.unidadeId,
    matricula: payload.matricula.trim(),
    nome: payload.nome.trim(),
    cargo: payload.cargo,
    dataAdmissao: payload.dataAdmissao,
    situacao: 'ativo' as const,
    ...(payload.concederAcesso
      ? {
          criarUsuarioAdmin: true,
          role: mapPerfilToRoleApi(payload.role ?? 'operador'),
          usuarioSenha: payload.senha?.trim(),
          unidadesIds: [payload.unidadeId],
          ...(payload.email?.trim() ? { email: payload.email.trim() } : {}),
        }
      : {}),
  };

  return createFuncionario(basePayload);
}

export async function updatePessoa(
  funcionarioId: number,
  payload: UpdatePessoaPayload,
) {
  const funcionarioResult = await updateFuncionario(funcionarioId, {
    ...(payload.unidadeId ? { unidadeId: payload.unidadeId } : {}),
    ...(payload.nome ? { nome: payload.nome.trim() } : {}),
    ...(payload.cargo ? { cargo: payload.cargo } : {}),
    ...(payload.dataAdmissao ? { dataAdmissao: payload.dataAdmissao } : {}),
  });

  if (payload.concederAcesso && payload.senha?.trim()) {
    const role = mapPerfilToRoleApi(payload.role ?? 'operador');
    const unidadeId = payload.unidadeId ?? funcionarioResult.unidadeId;

    if (payload.userId) {
      await updateUser(payload.userId, {
        name: payload.nome?.trim(),
        role,
        funcionarioId,
        unidadesIds: [unidadeId],
        ...(payload.email?.trim() ? { email: payload.email.trim() } : {}),
        password: payload.senha.trim(),
        status: 'ativo',
      });
    } else {
      await createUser({
        id: Number(funcionarioResult.matricula),
        name: payload.nome?.trim() ?? funcionarioResult.nome,
        email: payload.email?.trim() ?? `${funcionarioResult.matricula}@internal.lilog`,
        password: payload.senha.trim(),
        role,
        status: 'ativo',
        funcionarioId,
        unidadesIds: [unidadeId],
      });
    }
  } else if (payload.concederAcesso && payload.userId) {
    await updateUser(payload.userId, {
      name: payload.nome?.trim(),
      role: mapPerfilToRoleApi(payload.role ?? 'operador'),
      funcionarioId,
      unidadesIds: [payload.unidadeId ?? funcionarioResult.unidadeId],
      ...(payload.email?.trim() ? { email: payload.email.trim() } : {}),
      status: 'ativo',
    });
  }

  return funcionarioResult;
}

export async function bulkImportPessoas(
  payload: BulkImportPayload,
): Promise<BulkImportResult> {
  return apiRequest<BulkImportResult>('/funcionarios/bulk', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { mapPerfilToRoleApi };
