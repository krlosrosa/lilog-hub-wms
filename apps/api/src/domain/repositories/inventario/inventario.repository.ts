import type {
  ContagemTipo,
  CreateDemandaContagemInput,
  CreateInventarioInput,
  DemandaContagemPrioridade,
  DemandaContagemStatus,
  DemandaContagemTipo,
  DemandaEnderecoStatus,
  DemandaFiltros,
  InventarioStatus,
  InventarioTipo,
  SubmitContagemAvariaInput,
  SubmitContagemCegaInput,
  SubmitContagemValidacaoInput,
} from '../../model/inventario/inventario.model.js';

export const INVENTARIO_REPOSITORY = 'IInventarioRepository';

export type InventarioRecord = {
  id: string;
  codigo: string;
  nome: string;
  tipo: InventarioTipo;
  status: InventarioStatus;
  dataProgramada: Date;
  centroId: string;
  responsavelGestorId: number | null;
  responsavelGestorNome: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  pausedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DemandaContagemRecord = {
  id: string;
  inventarioId: string;
  nome: string;
  tipo: DemandaContagemTipo;
  prioridade: DemandaContagemPrioridade;
  status: DemandaContagemStatus;
  responsavelId: number;
  responsavelNome: string;
  ativo: boolean;
  filtros: DemandaFiltros;
  observacoes: string;
  alertaFragilidade: boolean;
  totalEnderecos: number;
  enderecosConferidos: number;
  createdAt: Date;
  updatedAt: Date;
};

export type DemandaEnderecoRecord = {
  id: string;
  demandaId: string;
  enderecoId: string;
  enderecoMascarado: string;
  zona: string;
  sequence: number;
  status: DemandaEnderecoStatus;
};

export type ContagemRecord = {
  id: string;
  demandaEnderecoId: string;
  tipo: ContagemTipo;
  operatorId: number;
  codigoProduto: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  lote: string | null;
  peso: string | null;
  createdAt: Date;
};

export type ContagemAvariaRecord = {
  id: string;
  demandaEnderecoId: string;
  motivo: string;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  photoCount: number;
  createdAt: Date;
};

export type ListInventariosFilter = {
  page?: number;
  limit?: number;
  search?: string;
  status?: InventarioStatus;
};

export type ListInventariosResult = {
  items: InventarioRecord[];
  total: number;
  page: number;
  limit: number;
};

export type InventarioKpiRecord = {
  acuraciaGlobal: number;
  acuraciaDeltaPercent: number;
  itensInventariados: number;
  itensMeta: number;
  divergenciasTotal: number;
  divergenciasDelta: number;
  statusAtualLabel: string;
  tempoEstimadoLabel: string | null;
};

export type InventarioTrendRecord = {
  mes: string;
  valorPercent: number;
};

export type InventarioDetalheRecord = InventarioRecord & {
  progressoPercent: number;
  itensContados: number;
  itensTotal: number;
  acuraciaPercent: number | null;
  divergenciasCount: number;
  setoresProgresso: Array<{
    id: string;
    nome: string;
    progressPercent: number;
    skuContados: number;
    skuTotal: number;
  }>;
};

export type ResolvedEnderecoCandidate = {
  id: string;
  enderecoMascarado: string;
  zona: string;
};

export interface IInventarioRepository {
  createInventario(data: CreateInventarioInput): Promise<InventarioRecord>;
  findInventarioById(id: string): Promise<InventarioRecord | null>;
  listInventarios(
    filter: ListInventariosFilter,
  ): Promise<ListInventariosResult>;
  updateInventarioStatus(
    id: string,
    status: InventarioStatus,
  ): Promise<InventarioRecord | null>;
  iniciarInventario(id: string): Promise<InventarioRecord | null>;
  getInventarioKpi(): Promise<InventarioKpiRecord>;
  getInventarioTrend(): Promise<InventarioTrendRecord[]>;
  getInventarioDetalhe(id: string): Promise<InventarioDetalheRecord | null>;
  resolveEnderecosForDemanda(
    centroId: string,
    filtros: DemandaFiltros,
  ): Promise<ResolvedEnderecoCandidate[]>;
  findEnderecosByIdsForCentro(
    centroId: string,
    enderecoIds: string[],
  ): Promise<ResolvedEnderecoCandidate[]>;
  createDemanda(
    data: CreateDemandaContagemInput,
    enderecoIds: string[],
  ): Promise<DemandaContagemRecord>;
  listDemandasByInventario(inventarioId: string): Promise<DemandaContagemRecord[]>;
  deleteDemanda(inventarioId: string, demandaId: string): Promise<void>;
  findDemandaById(demandaId: string): Promise<DemandaContagemRecord | null>;
  listDemandasForOperator(operatorId: number): Promise<DemandaContagemRecord[]>;
  listAllContagemDemandas(): Promise<DemandaContagemRecord[]>;
  listDemandaEnderecos(demandaId: string): Promise<DemandaEnderecoRecord[]>;
  findDemandaEnderecoById(
    demandaId: string,
    itemId: string,
  ): Promise<DemandaEnderecoRecord | null>;
  submitContagemCega(
    input: SubmitContagemCegaInput,
  ): Promise<ContagemRecord>;
  submitContagemValidacao(
    input: SubmitContagemValidacaoInput,
  ): Promise<ContagemRecord>;
  submitContagemAvaria(
    input: SubmitContagemAvariaInput,
  ): Promise<ContagemAvariaRecord>;
  markDemandaEnderecoEmAndamento(itemId: string): Promise<void>;
}
