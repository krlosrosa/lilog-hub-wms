export type EtapaOperacionalRead =
  | 'separacao'
  | 'conferencia'
  | 'carregamento'
  | 'finalizado';

export type MapaGrupoProcessoRead = 'separacao' | 'conferencia' | 'carregamento';

export type NivelPrioridadeTransporteRead =
  | 'urgente'
  | 'prioritaria'
  | 'normal'
  | 'baixa';

export type VwTransporteOperacionalRow = {
  transporteId: string;
  unidadeId: string;
  uploadLoteId: string;
  codigo: string;
  placa: string;
  transportadora: string;
  horarioExpectativaSaida: Date | null;
  statusAlocacao: string;
  etapaAtual: EtapaOperacionalRead;
  mapasTotal: number;
  mapasConcluidos: number;
  prioridade: boolean;
  isPrioridade: boolean;
  nivelPrioridade: NivelPrioridadeTransporteRead | null;
  reentregaExclusiva: boolean;
  tempoRestanteSaidaMin: number;
  tempoRestanteSaidaSeg: number;
  pesoTotalKg: number;
  viagemId: number | null;
  viagemInicioEm: Date | null;
  viagemFimEm: Date | null;
  anomalia: string | null;
  docaCodigo: string | null;
  lacreCarregamento: string | null;
};

export type VwPipelineTurnoRow = {
  unidadeId: string;
  uploadLoteId: string;
  processo: MapaGrupoProcessoRead;
  qtdMapasPendentes: number;
  qtdMapasFinalizados: number;
  tempoMedioParadoMin: string;
  volumeAcumuladoItens: number;
};

export type VwMapasPendentesRow = {
  mapaGrupoId: string;
  mapaLoteId: string;
  unidadeId: string;
  uploadLoteId: string;
  transporteId: string;
  transporteCodigo: string;
  microUuid: string;
  processo: MapaGrupoProcessoRead;
  titulo: string;
  iniciadoEm: Date | null;
  tempoEsperadoSeg: number;
  tempoParadoSeg: number;
  operadorNome: string | null;
  sessaoFuncionarioId: string | null;
  prioridade: boolean;
  isPrioridade: boolean;
  nivelPrioridade: NivelPrioridadeTransporteRead | null;
  reentregaExclusiva: boolean;
};

export type VwTimelineFinalizacaoHoraRow = {
  unidadeId: string;
  uploadLoteId: string;
  horaBucket: Date;
  gruposFinalizados: number;
};

export type VwTurnoExpedicaoRow = {
  uploadLoteId: string;
  unidadeId: string;
  dataReferencia: string;
  horarioExpectativaSaida: Date;
  turnoInicioEm: Date;
  totalTransportes: number;
  transportesFinalizados: number;
  mapasPendentes: number;
  mapasFinalizados: number;
  pesoTotalKg: string;
  pesoFinalizadoKg: string;
};

export const TORRE_CONTROLE_REPOSITORY = 'ITorreControleRepository';

export type TorreControleFiltro = {
  unidadeId: string;
  uploadLoteId: string;
};

export type MapaGrupoHorarioRow = {
  transporteId: string;
  processo: MapaGrupoProcessoRead;
  iniciadoEm: Date | null;
  finalizadoEm: Date | null;
};

export type MapaOperacionalRow = {
  mapaGrupoId: string;
  transporteId: string;
  transporteCodigo: string;
  processo: MapaGrupoProcessoRead;
  titulo: string;
  sequencia: number;
  iniciadoEm: Date | null;
  finalizadoEm: Date | null;
  tempoParadoSeg: number;
  operadorNome: string | null;
  prioridade: boolean;
};

export type TorreControleReadModel = {
  turno: VwTurnoExpedicaoRow | null;
  transportes: VwTransporteOperacionalRow[];
  pipeline: VwPipelineTurnoRow[];
  mapasPendentes: VwMapasPendentesRow[];
  mapasOperacionais: MapaOperacionalRow[];
  mapasHorarios: MapaGrupoHorarioRow[];
  timeline: VwTimelineFinalizacaoHoraRow[];
  paletesPorTransporte: Map<string, number>;
};

export interface ITorreControleRepository {
  obterReadModel(filtro: TorreControleFiltro): Promise<TorreControleReadModel>;
}
