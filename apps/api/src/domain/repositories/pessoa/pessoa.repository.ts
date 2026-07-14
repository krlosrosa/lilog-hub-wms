import type { FuncionarioSituacao } from '../../model/funcionario/funcionario.model.js';
import type { UserRole, UserStatus } from '../../model/user/user.model.js';

export const PESSOA_REPOSITORY = 'IPessoaRepository';

export type PessoaRecord = {
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  situacao: FuncionarioSituacao;
  unidadeId: string;
  dataAdmissao: Date;
  equipeId: string | null;
  equipeNome: string | null;
  userId: number | null;
  userStatus: UserStatus | null;
  userRole: UserRole | null;
  mustChangePassword: boolean | null;
  userEmail: string | null;
};

export type ListPessoasFilter = {
  page: number;
  limit: number;
  unidadeId?: string;
  situacao?: FuncionarioSituacao;
  cargo?: string;
  search?: string;
  temAcesso?: boolean;
  equipeId?: string;
  semEquipe?: boolean;
  funcionarioId?: number;
};

export type ListPessoasResult = {
  items: PessoaRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface IPessoaRepository {
  list(filter: ListPessoasFilter): Promise<ListPessoasResult>;
}
