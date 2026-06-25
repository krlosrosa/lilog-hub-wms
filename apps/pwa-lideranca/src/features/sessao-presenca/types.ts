export type SessaoTrabalhoStatusApi =
  | 'planejada'
  | 'aberta'
  | 'encerrada'
  | 'cancelada';

export type SessaoPresencaStatusApi =
  | 'esperado'
  | 'presente'
  | 'falta'
  | 'atestado'
  | 'folga'
  | 'atraso';

export type SessaoApi = {
  id: string;
  unidadeId: string;
  escalaId: string;
  equipeId: string;
  dataReferencia: string;
  inicioPlanejado: string;
  fimPlanejado: string;
  inicioReal: string | null;
  fimReal: string | null;
  status: SessaoTrabalhoStatusApi;
  escalaNome: string;
  equipeNome: string;
  horaInicioPlanejada: string;
  horaFimPlanejada: string;
  cruzaMeiaNoite: boolean;
  totalFuncionarios: number;
  abertaPorUserId: number | null;
  encerradaPorUserId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type SessaoFuncionarioApi = {
  id: string;
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  status: SessaoPresencaStatusApi;
  checkIn: string | null;
  checkOut: string | null;
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
};

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

export type ListSessoesApiResponse = {
  items: SessaoApi[];
  total: number;
  page: number;
  limit: number;
};

export type ListSessaoFuncionariosApiResponse = {
  items: SessaoFuncionarioApi[];
};

export type ListEscalasApiResponse = {
  items: EscalaApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateSessaoPayload = {
  escalaId: string;
  dataReferencia: string;
};

export type UpdateSessaoPresencaPayload = {
  status?: SessaoPresencaStatusApi;
  checkIn?: string | null;
  checkOut?: string | null;
  observacao?: string | null;
};

export type SessaoStatusFiltro = SessaoTrabalhoStatusApi | 'todos';

export type PresencaFiltro = 'pendentes' | 'todos' | 'presentes' | 'faltas';

export type FeatureToast = {
  message: string;
  variant: 'success' | 'error';
};

export type PresencaStats = {
  total: number;
  presentes: number;
  pendentes: number;
  faltas: number;
  percentPresentes: number;
};
