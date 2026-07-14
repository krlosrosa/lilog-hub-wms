import type { FuncionarioCargo } from '@lilog/contracts';

export type FuncionarioSituacaoApi =
  | 'ativo'
  | 'afastado'
  | 'ferias'
  | 'desligado'
  | 'bloqueado';

export type FuncionarioCargoApi = FuncionarioCargo;

export type FuncionarioApi = {
  id: number;
  unidadeId: string;
  matricula: string;
  nome: string;
  cargo: FuncionarioCargoApi;
  situacao: FuncionarioSituacaoApi;
  dataAdmissao: string;
  telefone?: string | null;
  email?: string | null;
  observacao?: string | null;
  createdAt: string;
};

export type ListFuncionariosApiResponse = {
  items: FuncionarioApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateFuncionarioPayload = {
  unidadeId: string;
  matricula: string;
  nome: string;
  cargo: FuncionarioCargoApi;
  dataAdmissao: string;
  situacao?: FuncionarioSituacaoApi;
  telefone?: string;
  email?: string;
  observacao?: string;
  criarUsuarioAdmin?: boolean;
  usuarioSenha?: string;
  role?: 'admin' | 'manager' | 'operator';
  unidadesIds?: string[];
};

export type UpdateFuncionarioPayload = {
  unidadeId?: string;
  matricula?: string;
  nome?: string;
  cargo?: FuncionarioCargoApi;
  dataAdmissao?: string;
  situacao?: FuncionarioSituacaoApi;
  telefone?: string | null;
  email?: string | null;
  observacao?: string | null;
};

export type CreateFuncionarioApiResponse = {
  id: number;
  unidadeId: string;
  matricula: string;
  nome: string;
  cargo: FuncionarioCargoApi;
  situacao: FuncionarioSituacaoApi;
  dataAdmissao: string;
  createdAt: string;
  usuario?: {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    funcionarioId: number | null;
    createdAt: string;
  };
};
