import type { KpiAccent } from '@/features/gestao-recursos/types/gestao-recursos.schema';
import type { SessaoPresencaStatusApi } from '@/features/sessao-operacao/types/sessao.api';
import type { SessaoPausaTipoApi } from '@/features/pausas/types/pausas.api';

export type DemandaSeparacaoStatusApi =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'cancelada';

export type MapaGrupoProcessoApi =
  | 'separacao'
  | 'conferencia'
  | 'carregamento';

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
  transporteDocaId?: string | null;
  transporteLacreCarregamento?: string | null;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  status: DemandaSeparacaoStatusApi;
  atribuidoEm: string;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
  tempoEsperadoMinutos: number;
  funcionarios?: DemandaFuncionarioApi[];
};

export type MapaGrupoDisponivelApi = {
  id: string;
  mapaLoteId: string;
  microUuid: string;
  processo: MapaGrupoProcessoApi;
  titulo: string;
  subtitulo: string | null;
  transporteId: string;
  transporteRota: string | null;
  empresa: string;
  categoria: string;
  totalItens: number;
  totalCaixas: number;
  totalUnidades: number;
  pesoTotalKg: number;
  tempoEsperadoMinutos: number;
  createdAt: string;
};

export type MapaResumoTransporteApi = {
  transporteId: string;
  totalMapas: number;
  pesoTotalKg: number;
  totalCaixas: number;
  totalUnidades: number;
  totalPaletes: number;
  tempoTotalMinutos: number;
};

export type MapasResumoTransportesApiResponse = {
  items: MapaResumoTransporteApi[];
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

export type ListMapasGrupoDisponiveisApiResponse = {
  items: MapaGrupoDisponivelApi[];
};

export type CriarDemandasPayload = {
  sessaoId: string;
  sessaoFuncionarioId: string;
  mapaGrupoIds: string[];
};

export type CriarDemandasApiResponse = {
  demandas: DemandaSeparacaoApi[];
};

export type AddFuncionarioDemandaPayload = {
  sessaoFuncionarioId: string;
};
