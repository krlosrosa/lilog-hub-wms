import type { TipoCarga } from '@/features/transporte/types/perfil-tarifa.schema';

export type ItinerarioApi = {
  id: string;
  codigo: string;
};

export type FaixaKmApi = {
  id: string;
  kmInicial: string;
  kmFinal: string | null;
  valor: string;
  itinerario: string | null;
  itinerarios: ItinerarioApi[];
  createdAt: string;
  updatedAt: string;
};

export type PerfilTarifaApi = {
  id: string;
  unidadeId: string;
  idRavex: number;
  nome: string;
  descricao: string | null;
  peso: string;
  cubagem: string | null;
  tipoCarga: TipoCarga;
  faixasKm: FaixaKmApi[];
  createdAt: string;
  updatedAt: string;
};

export type ListPerfisTarifasApiResponse = {
  items: PerfilTarifaApi[];
};

export type CreatePerfilTarifaPayload = {
  unidadeId: string;
  idRavex: number;
  nome: string;
  descricao?: string | null;
  peso: number;
  cubagem?: number | null;
  tipoCarga: TipoCarga;
};

export type UpdatePerfilTarifaPayload = Partial<{
  nome: string;
  descricao: string | null;
  peso: number;
  cubagem: number | null;
  tipoCarga: TipoCarga;
}>;

export type UpsertFaixasKmPayload = {
  faixas: Array<{
    kmInicial: number;
    kmFinal?: number | null;
    valor: number;
    itinerarios?: string[];
  }>;
};
