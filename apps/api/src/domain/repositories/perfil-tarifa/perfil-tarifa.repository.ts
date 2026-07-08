import type {
  CreatePerfilTarifaInput,
  TipoCarga,
  UpdatePerfilTarifaInput,
  UpsertFaixasKmInput,
} from '../../model/perfil-tarifa/perfil-tarifa.model.js';

export const PERFIL_TARIFA_REPOSITORY = 'IPerfilTarifaRepository';

export type ItinerarioRecord = {
  id: string;
  codigo: string;
};

export type FaixaKmRecord = {
  id: string;
  kmInicial: string;
  kmFinal: string | null;
  valor: string;
  /** @deprecated legado — preferir itinerarios */
  itinerario: string | null;
  itinerarios: ItinerarioRecord[];
  createdAt: Date;
  updatedAt: Date;
};

export type PerfilTarifaRecord = {
  id: string;
  unidadeId: string;
  idRavex: number;
  nome: string;
  descricao: string | null;
  peso: string;
  cubagem: string | null;
  tipoCarga: TipoCarga;
  createdAt: Date;
  updatedAt: Date;
  faixasKm: FaixaKmRecord[];
};

export type ListPerfisTarifasFilter = {
  unidadeId?: string;
  tipoCarga?: TipoCarga;
};

export interface IPerfilTarifaRepository {
  list(filter: ListPerfisTarifasFilter): Promise<PerfilTarifaRecord[]>;
  findById(id: string): Promise<PerfilTarifaRecord | null>;
  findByUnidadeAndRavexId(
    unidadeId: string,
    idRavex: number,
  ): Promise<PerfilTarifaRecord | null>;
  create(data: CreatePerfilTarifaInput): Promise<PerfilTarifaRecord>;
  update(
    id: string,
    data: UpdatePerfilTarifaInput,
  ): Promise<PerfilTarifaRecord | null>;
  delete(id: string): Promise<void>;
  upsertFaixasKm(
    id: string,
    data: UpsertFaixasKmInput,
  ): Promise<PerfilTarifaRecord | null>;
}
