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

export type MapaGrupoProcessoApi =
  | 'separacao'
  | 'conferencia'
  | 'carregamento';

export type GestaoRecursosProcessoApi = MapaGrupoProcessoApi | 'devolucao';

export type DemandaFuncionarioPapelApi = 'responsavel' | 'auxiliar';

export type DemandaFuncionarioApi = {
  id: string;
  demandaId: string;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  papel: DemandaFuncionarioPapelApi;
  entrouEm: string;
  saiuEm: string | null;
};

export type DemandaSeparacaoApi = {
  id: string;
  sessaoId: string;
  mapaGrupoId: string;
  mapaGrupoTitulo: string;
  mapaGrupoMicroUuid: string;
  mapaGrupoProcesso: MapaGrupoProcessoApi;
  transporteId: string;
  transporteRota: string | null;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  status: DemandaSeparacaoStatusApi;
  atribuidoEm: string;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
  tempoEsperadoMinutos: number;
  funcionarios?: DemandaFuncionarioApi[];
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
  tipoVinculo: 'titular' | 'apoio';
  equipeOrigemNome: string | null;
  apoioInicio: string | null;
  ultimaMissaoFinalizadaEm?: string | null;
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
  equipeArea: string | null;
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

export type DevolucaoAlocacaoFuncaoApi = 'lider' | 'conferente' | 'auxiliar';

export type DevolucaoAlocacaoEtapaApi =
  | 'aguardando'
  | 'checklist'
  | 'conferencia'
  | 'finalizacao'
  | 'concluida';

export type DemandaDevolucaoStatusApi =
  | 'rascunho'
  | 'aberta'
  | 'em_analise'
  | 'em_execucao'
  | 'concluida'
  | 'cancelada';

export type DemandaDevolucaoRecursoApi = {
  id: string;
  demandaId: string;
  codigoDemanda: string;
  status: DemandaDevolucaoStatusApi;
  etapa: DevolucaoAlocacaoEtapaApi;
  totalNfs: number;
  totalItens: number;
  pesoDevolvido: number;
  cliente: string | null;
  placa: string | null;
  transporteId: string | null;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  funcao: DevolucaoAlocacaoFuncaoApi;
  atribuidoEm: string;
  inicioEm: string | null;
  tempoEsperadoMinutos: number;
};

export type RecursosDevolucaoSessaoApiResponse = {
  sessaoId: string;
  unidadeId: string;
  funcionarios: RecursosSessaoFuncionarioApi[];
  alocacoes: DemandaDevolucaoRecursoApi[];
  kpis: RecursosSessaoKpiApi[];
};

export type FuncionarioApoioCandidatoApi = {
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  sessaoOrigemId: string;
  equipeOrigemId: string;
  equipeOrigemNome: string;
  equipeOrigemArea: string | null;
  statusPresenca: SessaoPresencaStatusApi;
};

export type ListFuncionariosApoioCandidatosApiResponse = {
  items: FuncionarioApoioCandidatoApi[];
};

export type SessaoFuncionarioApoioApi = {
  id: string;
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  status: SessaoPresencaStatusApi;
  checkIn: string | null;
  checkOut: string | null;
  observacao: string | null;
  tipoVinculo: 'titular' | 'apoio';
  equipeOrigemId: string | null;
  equipeOrigemNome: string | null;
  apoioInicio: string | null;
  apoioFim: string | null;
  createdAt: string;
  updatedAt: string;
};
