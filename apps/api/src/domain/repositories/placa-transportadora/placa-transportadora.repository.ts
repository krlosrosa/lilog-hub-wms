export const PLACA_TRANSPORTADORA_REPOSITORY = 'IPlacaTransportadoraRepository';

export type PlacaTransportadoraRecord = {
  id: string;
  transportadoraId: string;
  idRavexVeiculo: number;
  placa: string;
  tipoVeiculoIdRavex: number | null;
  tipoVeiculoNome: string | null;
  peso: string | null;
  cubagem: string | null;
  tara: string | null;
  estrangeiro: boolean;
  perfilTarifaId: string | null;
  perfilTarifaNome: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ListPlacasTransportadoraFilter = {
  transportadoraId: string;
  page?: number;
  limit?: number;
  search?: string;
  tipoVeiculo?: string;
};

export type PlacaTransportadoraComTransportadoraRecord = PlacaTransportadoraRecord & {
  transportadoraNome: string;
};

export type ListPlacasUnidadeFilter = {
  unidadeId: string;
  page?: number;
  limit?: number;
  search?: string;
  tipoVeiculo?: string;
};

export type BuscarPlacasUnidadeFilter = {
  unidadeId: string;
  placas: string[];
};

export type BuscarPlacasUnidadeResult = {
  items: PlacaTransportadoraComTransportadoraRecord[];
};

export type ListPlacasTransportadoraResult = {
  items: PlacaTransportadoraRecord[];
  total: number;
  page: number;
  limit: number;
};

export type ListPlacasUnidadeResult = {
  items: PlacaTransportadoraComTransportadoraRecord[];
  total: number;
  page: number;
  limit: number;
};

export type SyncPlacaTransportadoraInput = {
  idRavexVeiculo: number;
  placa: string;
  tipoVeiculoIdRavex: number | null;
  tipoVeiculoNome: string | null;
  peso: string | null;
  cubagem: string | null;
  tara: string | null;
  estrangeiro: boolean;
};

export type SyncPlacasTransportadoraInput = {
  transportadoraId: string;
  placas: SyncPlacaTransportadoraInput[];
};

export type SyncPlacasTransportadoraResult = {
  items: PlacaTransportadoraRecord[];
  total: number;
  inseridas: number;
  atualizadas: number;
  removidas: number;
};

export type AtualizarPerfilPlacaInput = {
  placaId: string;
  perfilTarifaId: string | null;
};

export type AtualizarPerfilPlacasMassaInput = {
  placaIds: string[];
  perfilTarifaId: string | null;
};

export type AtualizarPerfilPlacasMassaResult = {
  atualizadas: number;
};

export interface IPlacaTransportadoraRepository {
  list(
    filter: ListPlacasTransportadoraFilter,
  ): Promise<ListPlacasTransportadoraResult>;
  listByUnidade(
    filter: ListPlacasUnidadeFilter,
  ): Promise<ListPlacasUnidadeResult>;
  buscarByPlacasUnidade(
    filter: BuscarPlacasUnidadeFilter,
  ): Promise<BuscarPlacasUnidadeResult>;
  findById(id: string): Promise<PlacaTransportadoraRecord | null>;
  syncFromRavex(
    data: SyncPlacasTransportadoraInput,
  ): Promise<SyncPlacasTransportadoraResult>;
  atualizarPerfil(
    data: AtualizarPerfilPlacaInput,
  ): Promise<PlacaTransportadoraRecord>;
  atualizarPerfilMassa(
    data: AtualizarPerfilPlacasMassaInput,
  ): Promise<AtualizarPerfilPlacasMassaResult>;
}
