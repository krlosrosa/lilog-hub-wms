import { apiRequest } from '@/lib/api';

import type { WarehouseLayout } from '@/features/armazem-layout/types';

export type ArmazemLayoutSlotApi = {
  id: string;
  elementClientKey: string;
  slotIndex: number;
  nivel: number;
  enderecoId: string | null;
};

export type ArmazemLayoutApi = {
  id: string;
  unidadeId: string;
  name: string;
  gridCols: number;
  gridRows: number;
  versao: number;
  elements: WarehouseLayout['elements'];
  slots: ArmazemLayoutSlotApi[];
  publicadoEm: string | null;
  updatedAt: string;
};

export type ArmazemLayoutSlotOcupacaoApi = ArmazemLayoutSlotApi & {
  endereco: {
    id: string;
    enderecoMascarado: string;
    zona: string;
    rua: string;
    posicao: string;
    nivel: string;
    status: 'disponivel' | 'ocupado' | 'bloqueado' | 'inventario' | 'inativo';
    ocupacaoPercent: string;
  } | null;
};

export type ArmazemLayoutOcupacaoApi = Omit<ArmazemLayoutApi, 'slots'> & {
  slots: ArmazemLayoutSlotOcupacaoApi[];
};

export function mapArmazemLayoutApiToWarehouseLayout(
  api: ArmazemLayoutApi,
): WarehouseLayout {
  return {
    name: api.name,
    gridCols: api.gridCols,
    gridRows: api.gridRows,
    elements: api.elements,
  };
}

export async function getArmazemLayout(
  unidadeId: string,
): Promise<ArmazemLayoutApi | null> {
  return apiRequest<ArmazemLayoutApi | null>(
    `/armazem-layout?unidadeId=${encodeURIComponent(unidadeId)}`,
  );
}

export async function saveArmazemLayout(payload: {
  unidadeId: string;
  name: string;
  gridCols: number;
  gridRows: number;
  elements: WarehouseLayout['elements'];
}): Promise<ArmazemLayoutApi> {
  return apiRequest<ArmazemLayoutApi>('/armazem-layout', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getArmazemLayoutOcupacao(
  unidadeId: string,
): Promise<ArmazemLayoutOcupacaoApi | null> {
  return apiRequest<ArmazemLayoutOcupacaoApi | null>(
    `/armazem-layout/ocupacao?unidadeId=${encodeURIComponent(unidadeId)}`,
  );
}

export async function vincularArmazemLayoutSlotEndereco(
  slotId: string,
  enderecoId: string | null,
): Promise<ArmazemLayoutSlotApi> {
  return apiRequest<ArmazemLayoutSlotApi>(
    `/armazem-layout/slots/${encodeURIComponent(slotId)}/endereco`,
    {
      method: 'PATCH',
      body: JSON.stringify({ enderecoId }),
    },
  );
}
