import type { FilialListaItem } from '@/features/filiais/types/filial-lista.schema';
import type { FilialFormValues } from '@/features/filiais/types/filial.schema';
import type { UnidadeApi } from '@/features/filiais/types/unidade.api';

export function mapUnidadeToFormValues(unidade: UnidadeApi): FilialFormValues {
  return {
    id: unidade.id,
    nome: unidade.nome,
    cluster: unidade.cluster,
    nomeFilial: unidade.nomeFilial,
  };
}

export function mapFilialListaToFormValues(
  item: FilialListaItem,
): FilialFormValues {
  return {
    id: item.id,
    nome: item.nome,
    cluster: item.cluster,
    nomeFilial: item.nomeFilial,
  };
}
