export type UserStatusApi =
  | 'ativo'
  | 'bloqueado'
  | 'pendente'
  | 'inativo';

export type UserRoleApi = 'admin' | 'manager' | 'operator' | 'leader';

export type UserApi = {
  id: number;
  name: string;
  email: string;
  role: UserRoleApi;
  status: UserStatusApi;
  mustChangePassword?: boolean;
  funcionarioId: number | null;
  createdAt: string;
};

export type ListUsersApiResponse = {
  items: UserApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateUserPayload = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRoleApi;
  status?: UserStatusApi;
  funcionarioId: number;
  unidadesIds?: string[];
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRoleApi;
  status?: UserStatusApi;
  funcionarioId?: number | null;
  unidadesIds?: string[];
};

export type ChangeOwnPasswordPayload = {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
};
