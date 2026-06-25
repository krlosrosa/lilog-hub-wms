export type FuncionarioSituacaoApi =
  | 'ativo'
  | 'afastado'
  | 'ferias'
  | 'desligado'
  | 'bloqueado';

export type FuncionarioCargoApi =
  | 'operador_empilhadeira'
  | 'separador'
  | 'conferente'
  | 'ajudante'
  | 'administrativo'
  | 'estoquista'
  | 'inventariante'
  | 'carregador'
  | 'recebedor'
  | 'supervisor'
  | 'analista'
  | 'gerente'
  | 'administrador';

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
  situacao?: FuncionarioSituacaoApi;
  dataAdmissao: string;
  telefone?: string;
  email?: string;
  observacao?: string;
  criarUsuarioAdmin?: boolean;
  usuarioSenha?: string;
};

export type CreateFuncionarioApiResponse = FuncionarioApi & {
  usuario?: {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'operator';
    status: 'ativo' | 'bloqueado' | 'pendente' | 'inativo';
    funcionarioId: number | null;
    createdAt: string;
  };
};

export type UpdateFuncionarioPayload = Partial<CreateFuncionarioPayload>;
