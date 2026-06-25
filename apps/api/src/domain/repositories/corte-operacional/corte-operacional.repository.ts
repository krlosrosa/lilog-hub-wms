import type {
  CancelarCorteInput,
  CorteStatus,
  ListCortesInput,
  SolicitarCorteInput,
  TransicaoCorteInput,
} from '../../model/corte-operacional/corte-operacional.model.js';

export const CORTE_OPERACIONAL_REPOSITORY = 'ICorteOperacionalRepository';

export type CorteItemRecord = {
  id: string;
  corteId: string;
  mapaGrupoItemId: string;
  sku: string;
  descricao: string | null;
  remessa: string;
  cliente: string;
  lote: string | null;
  quantidadeMapa: number;
  quantidadeCorte: number;
  unidadeMedida: string;
  pesoKg: number | null;
  createdAt: Date;
};

export type CorteRecord = {
  id: string;
  unidadeId: string;
  codigo: string;
  mapaGrupoId: string;
  transporteId: string;
  mapaGrupoMicroUuid: string;
  mapaGrupoTitulo: string;
  rota: string;
  doca: string | null;
  status: CorteStatus;
  motivo: string | null;
  observacao: string | null;
  totalVolumes: number | null;
  pesoTotalKg: number | null;
  solicitadoPor: number;
  solicitadoPorNome: string | null;
  solicitadoEm: Date;
  realizadoPor: number | null;
  realizadoPorNome: string | null;
  realizadoEm: Date | null;
  canceladoPor: number | null;
  canceladoPorNome: string | null;
  canceladoEm: Date | null;
  motivoCancelamento: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CorteDetalheRecord = CorteRecord & {
  itens: CorteItemRecord[];
};

export type MapaGrupoItemCorteRecord = {
  id: string;
  sku: string;
  descricao: string | null;
  remessa: string;
  cliente: string;
  lote: string | null;
  quantidade: number;
  unidadeMedida: string;
  peso: number | null;
};

export type MapaGrupoCorteRecord = {
  id: string;
  microUuid: string;
  titulo: string;
  subtitulo: string | null;
  transporteId: string;
  transporteRota: string;
  totalItens: number;
  pesoTotalKg: number;
  unidadeId: string;
  processo: 'separacao' | 'carregamento' | 'conferencia';
  itens: MapaGrupoItemCorteRecord[];
};

export type MapaGrupoItemValidacaoRecord = {
  id: string;
  mapaGrupoId: string;
  quantidade: number;
  sku: string;
  descricao: string | null;
  remessa: string;
  cliente: string;
  lote: string | null;
  unidadeMedida: string;
  peso: number | null;
};

export type SolicitarCortePersistInput = SolicitarCorteInput & {
  rota: string;
  transporteId: string;
  mapaGrupoTitulo: string;
  itens: Array<{
    mapaGrupoItemId: string;
    quantidadeCorte: number;
    sku: string;
    descricao: string | null;
    remessa: string;
    cliente: string;
    lote: string | null;
    quantidadeMapa: number;
    unidadeMedida: string;
    peso: number | null;
  }>;
};

export interface ICorteOperacionalRepository {
  findMapaGrupoPorCodigo(
    codigo: string,
    unidadeId: string,
  ): Promise<MapaGrupoCorteRecord | null>;
  findMapaGrupoItensByIds(
    mapaGrupoItemIds: string[],
    mapaGrupoId: string,
  ): Promise<MapaGrupoItemValidacaoRecord[]>;
  existsCorteAtivoByMapaGrupoId(mapaGrupoId: string): Promise<boolean>;
  solicitarCorte(input: SolicitarCortePersistInput): Promise<CorteDetalheRecord>;
  listCortes(
    input: ListCortesInput,
  ): Promise<{ items: CorteRecord[]; total: number }>;
  findCorteById(
    corteId: string,
    unidadeId: string,
  ): Promise<CorteDetalheRecord | null>;
  iniciarCorte(input: TransicaoCorteInput): Promise<CorteDetalheRecord | null>;
  realizarCorte(input: TransicaoCorteInput): Promise<CorteDetalheRecord | null>;
  cancelarCorte(input: CancelarCorteInput): Promise<CorteDetalheRecord | null>;
}
