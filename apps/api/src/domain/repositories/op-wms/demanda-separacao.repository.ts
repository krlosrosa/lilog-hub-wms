import type {
  CriarDemandasSeparacaoInput,
  DemandaSeparacaoStatus,
} from '../../model/op-wms/demanda-separacao.model.js';

export const DEMANDA_SEPARACAO_REPOSITORY = 'IDemandaSeparacaoRepository';

export type DemandaSeparacaoRecord = {
  id: string;
  unidadeId: string;
  sessaoId: string;
  mapaGrupoId: string;
  sessaoFuncionarioId: string;
  status: DemandaSeparacaoStatus;
  atribuidoPor: number | null;
  atribuidoEm: Date;
  iniciadoEm: Date | null;
  finalizadoEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemandaSeparacaoDetalheRecord = DemandaSeparacaoRecord & {
  funcionarioId: number;
  mapaGrupoTitulo: string;
  mapaGrupoMicroUuid: string;
  mapaGrupoProcesso: MapaGrupoProcessoRecord;
  transporteId: string;
  transporteRota: string | null;
  transporteDocaId: string | null;
  transporteLacreCarregamento: string | null;
  tempoEsperadoMinutos: number;
};

export type MapaGrupoProcessoRecord =
  | 'separacao'
  | 'conferencia'
  | 'carregamento';

export type DemandaFuncionarioPapelRecord = 'responsavel' | 'auxiliar';

export type DemandaFuncionarioRecord = {
  id: string;
  demandaId: string;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  papel: DemandaFuncionarioPapelRecord;
  entrouEm: Date;
  saiuEm: Date | null;
};

export type MapaGrupoDisponivelRecord = {
  id: string;
  mapaLoteId: string;
  microUuid: string;
  processo: MapaGrupoProcessoRecord;
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
  createdAt: Date;
};

export type MapaResumoTransporteRecord = {
  transporteId: string;
  totalMapas: number;
  pesoTotalKg: number;
  totalCaixas: number;
  totalUnidades: number;
  totalPaletes: number;
  tempoTotalMinutos: number;
};

export type RecursosSessaoFuncionarioRecord = {
  id: string;
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  statusPresenca: 'esperado' | 'presente' | 'falta' | 'atestado' | 'folga' | 'atraso';
  checkIn: Date | null;
  checkOut: Date | null;
  pausaAtiva: {
    id: string;
    tipo: 'termica' | 'refeicao' | 'outros';
    inicio: Date;
  } | null;
};

export type RecursosSessaoKpiRecord = {
  id: string;
  label: string;
  value: string;
  suffix?: string;
  progress?: number;
  footer?: string;
  accent: 'primary' | 'tertiary' | 'destructive' | 'muted';
};

export type RecursosSessaoRecord = {
  sessaoId: string;
  unidadeId: string;
  funcionarios: RecursosSessaoFuncionarioRecord[];
  demandas: DemandaSeparacaoDetalheRecord[];
  kpis: RecursosSessaoKpiRecord[];
};

export interface IDemandaSeparacaoRepository {
  listBySessaoId(sessaoId: string): Promise<DemandaSeparacaoDetalheRecord[]>;
  listMapasGrupoDisponiveis(
    unidadeId: string,
    processo?: MapaGrupoProcessoRecord,
  ): Promise<MapaGrupoDisponivelRecord[]>;
  resumoMapasTransportes(
    unidadeId: string,
    transporteIds: string[],
  ): Promise<MapaResumoTransporteRecord[]>;
  findMapaGrupoByIds(
    mapaGrupoIds: string[],
    unidadeId: string,
  ): Promise<
    Array<{
      id: string;
      titulo: string;
      microUuid: string;
      transporteId: string;
      processo: 'separacao' | 'carregamento' | 'conferencia';
      finalizadoEm: Date | null;
      iniciadoEm: Date | null;
    }>
  >;
  findDemandasAtivasByMapaGrupoIds(
    mapaGrupoIds: string[],
  ): Promise<DemandaSeparacaoRecord[]>;
  createBatch(
    input: CriarDemandasSeparacaoInput & { unidadeId: string },
  ): Promise<DemandaSeparacaoDetalheRecord[]>;
  findDetalheById(
    demandaId: string,
  ): Promise<DemandaSeparacaoDetalheRecord | null>;
  finalizarDemanda(
    demandaId: string,
  ): Promise<DemandaSeparacaoDetalheRecord | null>;
  addFuncionario(
    demandaId: string,
    sessaoFuncionarioId: string,
    papel: DemandaFuncionarioPapelRecord,
  ): Promise<DemandaFuncionarioRecord>;
  removeFuncionario(
    demandaId: string,
    sessaoFuncionarioId: string,
  ): Promise<void>;
  listFuncionarios(demandaId: string): Promise<DemandaFuncionarioRecord[]>;
  listFuncionariosByDemandaIds(
    demandaIds: string[],
  ): Promise<DemandaFuncionarioRecord[]>;
}
