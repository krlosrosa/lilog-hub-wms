import { apiRequest } from '@/lib/api';

import type {
  CreateDepositoPayload,
  DepositoApi,
  ListDepositosApiResponse,
  UpdateDepositoPayload,
} from '@/features/depositos/types/deposito.api';
import type { DepositoListaItem } from '@/features/depositos/types/depositos-gestao.schema';

export function mapDepositoToListaItem(deposito: DepositoApi): DepositoListaItem {
  return {
    id: deposito.id,
    codigo: deposito.codigo,
    nome: deposito.nome,
    finalidade: deposito.finalidade,
    permiteVenda: deposito.permiteVenda,
    permitePicking: deposito.permitePicking,
    exigeEndereco: deposito.exigeEndereco,
    contaDisponivel: deposito.contaDisponivel,
    sistema: deposito.sistema,
    ativo: deposito.ativo,
  };
}

export function listDepositos(unidadeId: string) {
  const params = new URLSearchParams({ unidadeId });
  return apiRequest<ListDepositosApiResponse>(
    `/estoque/depositos?${params.toString()}`,
  );
}

export function createDeposito(payload: CreateDepositoPayload) {
  return apiRequest<DepositoApi>('/estoque/depositos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateDeposito(id: string, payload: UpdateDepositoPayload) {
  return apiRequest<DepositoApi>(`/estoque/depositos/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
