import type {
  CreateEnderecoData,
  EnderecoStatus,
  EnderecoTipo,
  UpdateEnderecoData,
} from '../../model/endereco/endereco.model.js';

export const ENDERECO_REPOSITORY = 'IEnderecoRepository';

export type EnderecoCentroRecord = {
  id: string;
  unidadeId: string;
  centro: string;
  empresa: string;
  nome: string;
};

export type EnderecoRecord = {
  id: string;
  enderecoMascarado: string;
  centroId: string;
  centro: EnderecoCentroRecord;
  zona: string;
  rua: string;
  posicao: string;
  nivel: string;
  tipo: EnderecoTipo;
  status: EnderecoStatus;
  tipoEstrutura: CreateEnderecoData['tipoEstrutura'];
  larguraMm: number;
  alturaMm: number;
  profundidadeMm: number;
  cargaMaxKg: string;
  capacidadeVolume: string | null;
  prioridadePicking: number | null;
  coordenadaX: string | null;
  coordenadaY: string | null;
  coordenadaZ: string | null;
  observacao: string | null;
  vinculoSkuFixo: boolean;
  regraLoteUnico: boolean;
  permiteMisturaValidade: boolean;
  permiteFracionado: boolean;
  curvaAbc: CreateEnderecoData['curvaAbc'];
  ocupacaoPercent: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ListEnderecosFilter = {
  page?: number;
  limit?: number;
  status?: EnderecoRecord['status'];
  centroId?: string;
  unidadeId?: string;
  search?: string;
  tipo?: EnderecoTipo;
  tipos?: EnderecoTipo[];
  sortBy?: 'default' | 'armazenagem';
  excludeIds?: string[];
};

export type EnderecoKpiFilter = {
  centroId?: string;
  unidadeId?: string;
};

export type ListEnderecosResult = {
  items: EnderecoRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface IEnderecoRepository {
  list(filter: ListEnderecosFilter): Promise<ListEnderecosResult>;
  getKpi(filter?: EnderecoKpiFilter): Promise<{
    totalEnderecos: number;
    totalEnderecosTrendPercent: number;
    ocupacaoGlobalPercent: number;
    posicoesBloqueadas: number;
    crossDockingAtivos: number;
    enderecosDisponiveis: number;
    enderecosOcupados: number;
    taxaOcupacaoGeral: number;
  }>;
  findById(id: string): Promise<EnderecoRecord | null>;
  findByCentroAndCodigo(
    centroId: string,
    enderecoMascarado: string,
  ): Promise<EnderecoRecord | null>;
  hasStock(id: string): Promise<boolean>;
  hasMovementHistory(id: string): Promise<boolean>;
  create(data: CreateEnderecoData): Promise<EnderecoRecord>;
  update(
    id: string,
    data: UpdateEnderecoData,
  ): Promise<EnderecoRecord | null>;
  delete(id: string): Promise<void>;
}
