export type EscalaApi = {
  id: string;
  unidadeId: string;
  equipeId: string;
  nome: string;
  horaInicioPlanejada: string;
  horaFimPlanejada: string;
  cruzaMeiaNoite: boolean;
  ativo: boolean;
  equipeNome: string;
  equipeArea: string | null;
  totalFuncionarios: number;
  createdAt: string;
  updatedAt: string;
};

export type ListEscalasApiResponse = {
  items: EscalaApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateEscalaPayload = {
  unidadeId: string;
  nomeEscala: string;
  horaInicio: string;
  horaFim: string;
  nomeEquipe: string;
  area?: string;
};

export type EscalaFuncionarioApi = {
  id: string;
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  createdAt: string;
};

export type ListEscalaFuncionariosApiResponse = {
  items: EscalaFuncionarioApi[];
};

export type AddEscalaFuncionariosApiResponse = {
  items: EscalaFuncionarioApi[];
  adicionados: number;
};
