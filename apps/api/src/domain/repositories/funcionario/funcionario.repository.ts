import type {
  CreateFuncionarioInput,
  Funcionario,
  FuncionarioSituacao,
  UpdateFuncionarioInput,
} from '../../model/funcionario/funcionario.model.js';

export const FUNCIONARIO_REPOSITORY = 'IFuncionarioRepository';

export type FuncionarioRecord = Funcionario;

export type ListFuncionariosFilter = {
  unidadeId?: string;
  cargo?: string;
  situacao?: FuncionarioSituacao;
  search?: string;
  page: number;
  limit: number;
};

export type ListFuncionariosResult = {
  items: FuncionarioRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface IFuncionarioRepository {
  findById(id: number): Promise<FuncionarioRecord | null>;
  findByMatricula(
    unidadeId: string,
    matricula: string,
  ): Promise<FuncionarioRecord | null>;
  create(data: CreateFuncionarioInput): Promise<FuncionarioRecord>;
  update(
    id: number,
    data: UpdateFuncionarioInput,
  ): Promise<FuncionarioRecord | null>;
  list(filter: ListFuncionariosFilter): Promise<ListFuncionariosResult>;
}
