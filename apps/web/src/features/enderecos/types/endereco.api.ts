import type {
  CurvaAbc,
  EnderecoStatus,
  EnderecoTipo,
} from '@/features/enderecos/types/enderecos-gestao.schema';
import type { EmpresaCodigo } from '@/features/filiais/types/centro-cadastro.schema';

export type EnderecoUnidadeApi = {
  id: string;
  nome: string;
  cluster: string;
  nomeFilial: string;
};

export type EnderecoApi = {
  id: string;
  enderecoMascarado: string;
  unidadeId: string;
  unidade: EnderecoUnidadeApi;
  zona: string;
  rua: string;
  posicao: string;
  nivel: string;
  tipo: EnderecoTipo;
  status: EnderecoStatus;
  tipoEstrutura: string;
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
  curvaAbc: CurvaAbc;
  ocupacaoPercent: string;
  createdAt: string;
  updatedAt: string;
};

export type ListEnderecosApiResponse = {
  items: EnderecoApi[];
  total: number;
  page: number;
  limit: number;
};

export type EnderecoKpiApi = {
  totalEnderecos: number;
  totalEnderecosTrendPercent: number;
  ocupacaoGlobalPercent: number;
  posicoesBloqueadas: number;
  crossDockingAtivos: number;
  enderecosDisponiveis: number;
  enderecosOcupados: number;
  taxaOcupacaoGeral: number;
};

export type CentroOptionApi = {
  id: string;
  unidadeId: string;
  centro: string;
  empresa: EmpresaCodigo;
  nome: string;
  unidadeNome: string;
  unidadeFilial: string;
  createdAt: string;
};

export type CreateEnderecoPayload = {
  unidadeId: string;
  zona: string;
  rua: string;
  posicao: string;
  nivel: string;
  tipo: EnderecoTipo;
  tipoEstrutura: string;
  larguraMm: number;
  alturaMm: number;
  profundidadeMm: number;
  cargaMaxKg: number;
  capacidadeVolume?: number;
  prioridadePicking?: number;
  coordenadaX?: number;
  coordenadaY?: number;
  coordenadaZ?: number;
  observacao?: string;
  vinculoSkuFixo: boolean;
  regraLoteUnico: boolean;
  permiteMisturaValidade: boolean;
  permiteFracionado: boolean;
  curvaAbc: CurvaAbc;
};

export type UpdateEnderecoPayload = Partial<
  Omit<
    CreateEnderecoPayload,
    'capacidadeVolume' | 'prioridadePicking' | 'coordenadaX' | 'coordenadaY' | 'coordenadaZ' | 'observacao'
  >
> & {
  capacidadeVolume?: number | null;
  prioridadePicking?: number | null;
  coordenadaX?: number | null;
  coordenadaY?: number | null;
  coordenadaZ?: number | null;
  observacao?: string | null;
  status?: EnderecoStatus;
  ocupacaoPercent?: number;
  motivoAlteracao?: string;
};

export type EnderecoActionPayload = {
  motivo?: string;
};

export type ErroImportacaoEndereco = {
  linha: number;
  codigo: string;
  campo: string;
  mensagem: string;
};

export type ImportEnderecosResponse = {
  total: number;
  inserted: number;
  errors: ErroImportacaoEndereco[];
};
