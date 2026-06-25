import type { KpiAccent } from '@/features/gestao-recursos/types/gestao-recursos.schema';

export type SessaoPausaTipoApi = 'termica' | 'refeicao' | 'outros';

export type SessaoPresencaStatusApi =
  | 'esperado'
  | 'presente'
  | 'falta'
  | 'atestado'
  | 'folga'
  | 'atraso';

export type DemandaSeparacaoStatusApi =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'cancelada';

export type DemandaSeparacaoApi = {
  id: string;
  sessaoId: string;
  mapaGrupoId: string;
  mapaGrupoTitulo: string;
  mapaGrupoMicroUuid: string;
  transporteId: string;
  transporteRota: string | null;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  status: DemandaSeparacaoStatusApi;
  atribuidoEm: string;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
  tempoEsperadoMinutos: number;
};

export type AlertaPausaApi = {
  precisaPausa: boolean;
  tipoSugerido: SessaoPausaTipoApi;
  tempoTrabalhoContinuoMinutos: number;
  intervaloReferenciaMinutos: number;
  duracaoPausaMinutos: number;
  atrasoMinutos: number;
  referenciaTrabalhoIso: string;
};

export type ProximaPausaApi = AlertaPausaApi & {
  tempoRestanteMinutos: number;
};

export type RecursosSessaoFuncionarioApi = {
  id: string;
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  statusPresenca: SessaoPresencaStatusApi;
  checkIn: string | null;
  checkOut: string | null;
  pausaAtiva: {
    id: string;
    tipo: SessaoPausaTipoApi;
    inicio: string;
  } | null;
  alertaPausa: AlertaPausaApi | null;
  proximaPausa: ProximaPausaApi | null;
};

export type RecursosSessaoKpiApi = {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  progress?: number;
  footer?: string;
  accent: KpiAccent;
};

export type RecursosSessaoApiResponse = {
  sessaoId: string;
  unidadeId: string;
  funcionarios: RecursosSessaoFuncionarioApi[];
  demandas: DemandaSeparacaoApi[];
  kpis: RecursosSessaoKpiApi[];
};

export type SessaoTrabalhoStatusApi =
  | 'planejada'
  | 'aberta'
  | 'encerrada'
  | 'cancelada';

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

export type ListSessoesApiResponse = {
  items: SessaoApi[];
  total: number;
  page: number;
  limit: number;
};
