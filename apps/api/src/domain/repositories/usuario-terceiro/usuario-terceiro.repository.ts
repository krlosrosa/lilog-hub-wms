import type {
  CreateUsuarioTerceiroInput,
  UpdateUsuarioTerceiroInput,
  UsuarioTerceiro,
  UsuarioTerceiroStatus,
} from '../../model/usuario-terceiro/usuario-terceiro.model.js';

export const USUARIO_TERCEIRO_REPOSITORY = 'IUsuarioTerceiroRepository';

export type UsuarioTerceiroRecord = {
  id: number;
  nome: string;
  email: string;
  passwordHash: string;
  role: string;
  status: UsuarioTerceiroStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ListUsuariosTerceirosFilter = {
  status?: UsuarioTerceiroStatus;
  search?: string;
  page: number;
  limit: number;
};

export type ListUsuariosTerceirosResult = {
  items: UsuarioTerceiroRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface IUsuarioTerceiroRepository {
  findByEmail(email: string): Promise<UsuarioTerceiroRecord | null>;
  findById(id: number): Promise<UsuarioTerceiroRecord | null>;
  create(data: CreateUsuarioTerceiroInput): Promise<UsuarioTerceiroRecord>;
  update(
    id: number,
    data: UpdateUsuarioTerceiroInput,
  ): Promise<UsuarioTerceiroRecord | null>;
  list(
    filter: ListUsuariosTerceirosFilter,
  ): Promise<ListUsuariosTerceirosResult>;
  block(id: number): Promise<UsuarioTerceiroRecord | null>;
}

export type { UsuarioTerceiro };
