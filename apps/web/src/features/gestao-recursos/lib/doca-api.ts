import { listDocas as listDocasBase } from '@/features/docas/lib/docas-api';
import { apiRequest } from '@/lib/api';

export type DocaSelectItem = {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
};

export async function listDocasExpedicao(
  unidadeId: string,
): Promise<DocaSelectItem[]> {
  const response = await listDocasBase({
    unidadeId,
    page: 1,
    limit: 100,
  });

  return response.items
    .filter(
      (doca) => doca.tipo === 'expedicao' || doca.tipo === 'compartilhada',
    )
    .map((doca) => ({
      id: doca.id,
      codigo: doca.codigo,
      nome: doca.nome,
      tipo: doca.tipo,
    }));
}

export function atualizarDadosCarregamentoTransporte(
  transporteId: string,
  payload: {
    unidadeId: string;
    docaId?: string | null;
    lacreCarregamento?: string | null;
  },
) {
  return apiRequest<void>(
    `/expedicao/transportes/${encodeURIComponent(transporteId)}/dados-carregamento`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}
