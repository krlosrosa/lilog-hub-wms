import { apiRequest } from '@/lib/api';

import type {
  CreatePerfilTarifaPayload,
  ListPerfisTarifasApiResponse,
  PerfilTarifaApi,
  UpdatePerfilTarifaPayload,
  UpsertFaixasKmPayload,
} from '@/features/transporte/types/perfil-tarifa.api';
import {
  parseDecimal,
  type PerfilTarifaItem,
  type TipoCarga,
} from '@/features/transporte/types/perfil-tarifa.schema';

type ListPerfisTarifasParams = {
  unidadeId?: string;
  tipoCarga?: TipoCarga;
};

export function mapPerfilTarifaToItem(perfil: PerfilTarifaApi): PerfilTarifaItem {
  return {
    id: perfil.id,
    unidadeId: perfil.unidadeId,
    idRavex: perfil.idRavex,
    nome: perfil.nome,
    descricao: perfil.descricao,
    peso: parseDecimal(perfil.peso),
    cubagem:
      perfil.cubagem !== null ? parseDecimal(perfil.cubagem) : null,
    tipoCarga: perfil.tipoCarga,
    faixasKm: perfil.faixasKm.map((faixa) => ({
      id: faixa.id,
      kmInicial: parseDecimal(faixa.kmInicial),
      kmFinal: faixa.kmFinal !== null ? parseDecimal(faixa.kmFinal) : null,
      valor: parseDecimal(faixa.valor),
      itinerarios:
        faixa.itinerarios?.length > 0
          ? faixa.itinerarios.map((item) => ({
              id: item.id,
              codigo: item.codigo,
            }))
          : faixa.itinerario
            ? [{ codigo: faixa.itinerario }]
            : [],
    })),
    createdAt: perfil.createdAt,
    updatedAt: perfil.updatedAt,
  };
}

export async function listPerfisTarifas(
  params: ListPerfisTarifasParams = {},
): Promise<ListPerfisTarifasApiResponse> {
  const searchParams = new URLSearchParams();

  if (params.unidadeId) {
    searchParams.set('unidadeId', params.unidadeId);
  }

  if (params.tipoCarga) {
    searchParams.set('tipoCarga', params.tipoCarga);
  }

  const query = searchParams.toString();
  const path = query ? `/perfis-tarifas?${query}` : '/perfis-tarifas';

  return apiRequest<ListPerfisTarifasApiResponse>(path);
}

export async function createPerfilTarifa(
  payload: CreatePerfilTarifaPayload,
): Promise<PerfilTarifaApi> {
  return apiRequest<PerfilTarifaApi>('/perfis-tarifas', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePerfilTarifa(
  id: string,
  payload: UpdatePerfilTarifaPayload,
): Promise<PerfilTarifaApi> {
  return apiRequest<PerfilTarifaApi>(`/perfis-tarifas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePerfilTarifa(id: string): Promise<void> {
  await apiRequest<void>(`/perfis-tarifas/${id}`, {
    method: 'DELETE',
  });
}

export async function upsertFaixasKm(
  id: string,
  payload: UpsertFaixasKmPayload,
): Promise<PerfilTarifaApi> {
  return apiRequest<PerfilTarifaApi>(`/perfis-tarifas/${id}/faixas-km`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export type RavexTipoVeiculo = {
  id: number;
  nome: string;
  peso: number;
  cubagem: number;
  tara: number;
};

export async function listTiposVeiculoRavex(): Promise<RavexTipoVeiculo[]> {
  return apiRequest<RavexTipoVeiculo[]>('/perfis-tarifas/ravex/tipos-veiculo');
}
