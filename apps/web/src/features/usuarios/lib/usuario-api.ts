import { apiRequest } from '@/lib/api';

import type {
  CreateUserPayload,
  ListUsersApiResponse,
  UpdateUserPayload,
  UserApi,
  UserRoleApi,
  UserStatusApi,
} from '@/features/usuarios/types/usuario.api';
import type {
  UsuarioKpi,
  UsuarioPerfil,
  UsuarioRecord,
  UsuarioStatus,
} from '@/features/usuarios/types/usuarios-gestao.schema';

type ListUsersParams = {
  page?: number;
  limit?: number;
  status?: UserStatusApi;
  funcionarioId?: number;
  unidadeId?: string;
  search?: string;
};

function mapRoleToPerfil(role: UserRoleApi): UsuarioPerfil {
  if (role === 'admin') return 'admin';
  if (role === 'manager') return 'gerente';
  return 'operador';
}

function mapPerfilToRole(perfil: UsuarioPerfil): UserRoleApi {
  if (perfil === 'admin') return 'admin';
  if (perfil === 'gerente' || perfil === 'analista') return 'manager';
  return 'operator';
}

function mapStatusApiToUi(status: UserStatusApi): UsuarioStatus {
  if (status === 'inativo' || status === 'pendente') return 'inativo';
  return status;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-BR');
}

export function mapUserToRecord(user: UserApi): UsuarioRecord {
  return {
    id: String(user.id),
    nome: user.name,
    email: user.email,
    perfil: mapRoleToPerfil(user.role),
    status: mapStatusApiToUi(user.status),
    lastLogin: formatDate(user.createdAt),
    securityLockout: user.status === 'bloqueado',
  };
}

export function buildUsuarioKpi(users: UserApi[], total: number): UsuarioKpi {
  const ativos = users.filter((user) => user.status === 'ativo').length;
  const bloqueados = users.filter((user) => user.status === 'bloqueado').length;

  return {
    totalPessoal: total,
    totalPessoalTrendPercent: 0,
    ativosAgora: ativos,
    ativosPercent: total > 0 ? Math.round((ativos / total) * 100) : 0,
    contasSinalizadas: bloqueados,
    rotacaoSenhaPercent: 0,
  };
}

export async function listUsers(
  params: ListUsersParams = {},
): Promise<ListUsersApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.funcionarioId) {
    searchParams.set('funcionarioId', String(params.funcionarioId));
  }
  if (params.unidadeId) {
    searchParams.set('unidadeId', params.unidadeId);
  }
  if (params.search?.trim()) searchParams.set('search', params.search.trim());

  const query = searchParams.toString();
  const path = query ? `/users?${query}` : '/users';

  return apiRequest<ListUsersApiResponse>(path);
}

export function createUser(payload: CreateUserPayload) {
  return apiRequest<UserApi>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: number, payload: UpdateUserPayload) {
  return apiRequest<UserApi>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function blockUser(id: number) {
  return apiRequest<UserApi>(`/users/${id}/block`, {
    method: 'PATCH',
  });
}

export function unblockUser(id: number) {
  return apiRequest<UserApi>(`/users/${id}/unblock`, {
    method: 'PATCH',
  });
}

export { mapPerfilToRole };
