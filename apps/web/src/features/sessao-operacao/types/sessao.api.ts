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

export type ListSessoesApiResponse = {
  items: SessaoApi[];
  total: number;
  page: number;
  limit: number;
};

export type ListSessaoFuncionariosApiResponse = {
  items: SessaoFuncionarioApi[];
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
