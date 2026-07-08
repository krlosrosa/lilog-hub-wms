import type {
  ContagemTipo,
  CreateDemandaContagemInput,
  CreateInventarioInput,
  DemandaContagemPrioridade,
  DemandaContagemStatus,
  DemandaContagemTipo,
  DemandaEnderecoStatus,
  DemandaFiltros,
  DivergenciaInventarioStatus,
  DivergenciaInventarioTipo,
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

export type SaldoEsperadoEnderecoItem = {
  saldoEnderecoId: string;
  produtoId: string;
  sku: string;
  nome: string;
  lote: string;
  quantidade: number;
  unidadeMedida: string;
  numeroSerie: string;
  unidadesPorCaixa: number | null;
};

export type DemandaEnderecoRecord = {
  id: string;
  demandaId: string;
  enderecoId: string;
  enderecoMascarado: string;
  unidadeId: string;
  zona: string;
  sequence: number;
  status: DemandaEnderecoStatus;
  saldoEsperado?: SaldoEsperadoEnderecoItem[];
};

export type ContagemRecord = {
  id: string;
  demandaEnderecoId: string;
  tipo: ContagemTipo;
  operatorId: number;
  codigoProduto: string;
  produtoId: string | null;
  saldoEnderecoId: string | null;
  quantidadeCaixas: number;
  quantidadeUnidades: number;
  lote: string | null;
  peso: string | null;
  enderecoVazio: boolean;
  anomaliaEncontrada: boolean;
  correspondeAoEsperado: boolean;
  createdAt: Date;
};

export type InventarioDivergenciaRecord = {
  id: string;
  contagemId: string;
  enderecoMascarado: string;
  zona: string;
  produtoId: string | null;
  sku: string;
  produtoNome: string;
  quantidadeEsperada: number;
  quantidadeContada: number;
  diferenca: number;
  tipo: 'falta' | 'sobra';
  enderecoVazio: boolean;
  anomaliaEncontrada: boolean;
  pendenteAjuste: boolean;
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
  ajustesPendentesCount: number;
  setoresProgresso: Array<{
    id: string;
    nome: string;
    progressPercent: number;
    skuContados: number;
    skuTotal: number;
  }>;
  divergencias: InventarioDivergenciaRecord[];
};

export type ResolvedEnderecoCandidate = {
  id: string;
  enderecoMascarado: string;
  zona: string;
};

export type CreateDivergenciaInput = {
  inventarioId: string;
  contagemId: string | null;
  enderecoId: string;
  saldoEnderecoId: string | null;
  depositoId: string | null;
  produtoId: string | null;
  sku: string;
  produtoNome: string;
  quantidadeEsperada: number;
  quantidadeContada: number;
  delta: number;
  unidadeMedida: string | null;
  lote: string | null;
  tipo: DivergenciaInventarioTipo;
  documentoRef: string;
};

export type UpdateDivergenciaStatusInput = {
  status: DivergenciaInventarioStatus;
  aprovadaPor?: number | null;
  aprovadaEm?: Date | null;
  motivoAprovacao?: string | null;
  reprovadaPor?: number | null;
  reprovadaEm?: Date | null;
  motivoReprovacao?: string | null;
};

export type UpdateDivergenciaContagemInput = {
  contagemId: string;
  saldoEnderecoId?: string | null;
  depositoId?: string | null;
  produtoId?: string | null;
  quantidadeEsperada: number;
  quantidadeContada: number;
  delta: number;
  lote?: string | null;
  tipo: DivergenciaInventarioTipo;
  documentoRef: string;
};

export type DivergenciaRecontagemAtualRecord = {
  id: string;
  demandaId: string;
  demandaStatus: DemandaContagemStatus;
  responsavelId: number;
  responsavelNome: string;
  solicitadaPor: number | null;
  solicitadaEm: Date;
  motivo: string;
};

export type InventarioDivergenciaRecontagemRecord = {
  id: string;
  inventarioId: string;
  divergenciaId: string;
  demandaId: string;
  solicitadaPor: number | null;
  responsavelId: number;
  motivo: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RecontagemContagemPendenteRecord = {
  divergenciaId: string;
  demandaId: string;
  enderecoId: string;
  unidadeId: string;
  contagem: ContagemRecord;
};

export type CreateDivergenciaRecontagemInput = {
  inventarioId: string;
  divergenciaId: string;
  demandaId: string;
  solicitadaPor: number | null;
  responsavelId: number;
  motivo: string;
};

export type DivergenciaInventarioPersistedRecord = {
  id: string;
  inventarioId: string;
  contagemId: string | null;
  enderecoId: string;
  enderecoMascarado: string;
  zona: string;
  saldoEnderecoId: string | null;
  depositoId: string | null;
  produtoId: string | null;
  sku: string;
  produtoNome: string;
  quantidadeEsperada: number;
  quantidadeContada: number;
  delta: number;
  unidadeMedida: string | null;
  lote: string | null;
  tipo: DivergenciaInventarioTipo;
  status: DivergenciaInventarioStatus;
  aprovadaPor: number | null;
  aprovadaEm: Date | null;
  motivoAprovacao: string | null;
  reprovadaPor: number | null;
  reprovadaEm: Date | null;
  motivoReprovacao: string | null;
  documentoRef: string;
  createdAt: Date;
  updatedAt: Date;
  recontagemAtual: DivergenciaRecontagemAtualRecord | null;
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
    skuBusca?: string,
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
    input: SubmitContagemCegaInput & {
      produtoId?: string | null;
      saldoEnderecoId?: string | null;
    },
  ): Promise<ContagemRecord>;
  submitContagemValidacao(
    input: SubmitContagemValidacaoInput & {
      produtoId?: string | null;
      saldoEnderecoId?: string | null;
    },
  ): Promise<ContagemRecord>;
  submitContagemAvaria(
    input: SubmitContagemAvariaInput,
  ): Promise<ContagemAvariaRecord>;
  markDemandaEnderecoEmAndamento(itemId: string): Promise<void>;
  activateDemandaContagem(demandaId: string): Promise<void>;
  listInventarioDivergencias(
    inventarioId: string,
  ): Promise<InventarioDivergenciaRecord[]>;
  listContagensValidacaoParaReconciliacao(
    inventarioId: string,
  ): Promise<
    Array<{
      contagem: ContagemRecord;
      enderecoId: string;
      unidadeId: string;
    }>
  >;
  createDivergencias(
    items: CreateDivergenciaInput[],
  ): Promise<DivergenciaInventarioPersistedRecord[]>;
  listDivergenciasByInventario(
    inventarioId: string,
  ): Promise<DivergenciaInventarioPersistedRecord[]>;
  findDivergenciaById(
    id: string,
  ): Promise<DivergenciaInventarioPersistedRecord | null>;
  updateDivergenciaStatus(
    id: string,
    data: UpdateDivergenciaStatusInput,
  ): Promise<DivergenciaInventarioPersistedRecord>;
  updateDivergenciaContagem(
    id: string,
    data: UpdateDivergenciaContagemInput,
  ): Promise<DivergenciaInventarioPersistedRecord>;
  findRecontagemAbertaByDivergencia(
    divergenciaId: string,
  ): Promise<DivergenciaRecontagemAtualRecord | null>;
  findRecontagemAbertaByDemanda(
    demandaId: string,
  ): Promise<InventarioDivergenciaRecontagemRecord | null>;
  createDivergenciaRecontagem(
    input: CreateDivergenciaRecontagemInput,
  ): Promise<InventarioDivergenciaRecontagemRecord>;
  concluirDemandaContagemSeCompleta(demandaId: string): Promise<void>;
  listRecontagensComContagemPendenteReconciliacao(
    inventarioId: string,
  ): Promise<RecontagemContagemPendenteRecord[]>;
}
