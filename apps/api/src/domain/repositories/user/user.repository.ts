import type {
  CreateUserInput,
  UpdateUserInput,
  User,
  UserStatus,
} from '../../model/user/user.model.js';

export const USER_REPOSITORY = 'IUserRepository';

export type UserRecord = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  status: UserStatus;
  funcionarioId: number | null;
  unidadeId: string | null;
  createdAt: Date;
};

export type ListUsersFilter = {
  status?: UserStatus;
  funcionarioId?: number;
  unidadeId?: string;
  search?: string;
  page: number;
  limit: number;
};

export type ListUsersResult = {
  items: UserRecord[];
  total: number;
  page: number;
  limit: number;
};

export type UserUnidadeRecord = {
  id: string;
  nome: string;
  nomeFilial: string;
  cluster: string;
};

export interface IUserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: number): Promise<UserRecord | null>;
  findActiveByFuncionarioId(funcionarioId: number): Promise<UserRecord | null>;
  create(data: CreateUserInput): Promise<UserRecord>;
  update(id: number, data: UpdateUserInput): Promise<UserRecord | null>;
  list(filter: ListUsersFilter): Promise<ListUsersResult>;
  block(id: number): Promise<UserRecord | null>;
  unblock(id: number): Promise<UserRecord | null>;
  blockByFuncionarioId(funcionarioId: number): Promise<number>;
  listAccessibleUnidades(userId: number): Promise<UserUnidadeRecord[]>;
}

export type { User };
