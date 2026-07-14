import type { FuncionarioCargo } from '@lilog/contracts';

export type FuncionarioSituacaoApi =
  | 'ativo'
  | 'afastado'
  | 'ferias'
  | 'desligado'
  | 'bloqueado';

export type UserStatusApi =
  | 'ativo'
  | 'bloqueado'
  | 'pendente'
  | 'inativo';

export type UserRoleApi = 'admin' | 'manager' | 'operator' | 'leader';

export type FuncionarioCargoApi = FuncionarioCargo;

export type PessoaApi = {
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: FuncionarioCargoApi;
  situacao: FuncionarioSituacaoApi;
  unidadeId: string;
  dataAdmissao: string;
  equipeId: string | null;
  equipeNome: string | null;
  userId: number | null;
  userStatus: UserStatusApi | null;
  userRole: UserRoleApi | null;
  mustChangePassword: boolean | null;
  userEmail: string | null;
};

export type ListPessoasApiResponse = {
  items: PessoaApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreatePessoaPayload = {
  unidadeId: string;
  matricula: string;
  nome: string;
  cargo: FuncionarioCargoApi;
  dataAdmissao: string;
  equipeId: string;
  concederAcesso: boolean;
  role?: 'admin' | 'lider' | 'operador';
  senha?: string;
  email?: string;
};

export type UpdatePessoaPayload = {
  unidadeId?: string;
  nome?: string;
  cargo?: FuncionarioCargoApi;
  dataAdmissao?: string;
  equipeId?: string;
  concederAcesso?: boolean;
  role?: 'admin' | 'lider' | 'operador';
  senha?: string;
  email?: string;
  userId?: number | null;
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
    role: UserRoleApi;
    status: UserStatusApi;
    funcionarioId: number | null;
    createdAt: string;
  };
};

export type BulkImportFuncionarioItem = {
  unidadeId: string;
  matricula: string;
  nome: string;
  cargo: FuncionarioCargoApi;
  dataAdmissao: string;
  equipeId: string;
  criarUsuario: boolean;
  senhaInicial?: string;
};

export type BulkImportPayload = {
  funcionarios: BulkImportFuncionarioItem[];
};

export type BulkImportFalha = {
  matricula: string;
  erro: string;
};

export type BulkImportResult = {
  total: number;
  sucesso: number;
  falhas: BulkImportFalha[];
};
