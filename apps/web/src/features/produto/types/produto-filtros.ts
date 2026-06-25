import type { EmpresaProdutoApi } from '@/features/produto/types/produto.api';
import type { TipoProduto } from '@/features/produto/types/produto.schema';

export type FiltroCodigoStatus = 'todos' | 'com' | 'sem';

export type ProdutoFiltrosAvancados = {
  empresa: EmpresaProdutoApi | 'todos';
  tipo: TipoProduto | 'todos';
  ean: FiltroCodigoStatus;
  dum: FiltroCodigoStatus;
};

export const DEFAULT_PRODUTO_FILTROS_AVANCADOS: ProdutoFiltrosAvancados = {
  empresa: 'todos',
  tipo: 'todos',
  ean: 'todos',
  dum: 'todos',
};

export function countProdutoFiltrosAvancadosAtivos(
  filtros: ProdutoFiltrosAvancados,
): number {
  let count = 0;

  if (filtros.empresa !== 'todos') count += 1;
  if (filtros.tipo !== 'todos') count += 1;
  if (filtros.ean !== 'todos') count += 1;
  if (filtros.dum !== 'todos') count += 1;

  return count;
}

export function hasProdutoFiltrosAvancadosAtivos(
  filtros: ProdutoFiltrosAvancados,
): boolean {
  return countProdutoFiltrosAvancadosAtivos(filtros) > 0;
}

export function mapProdutoFiltrosAvancadosToApiParams(
  filtros: ProdutoFiltrosAvancados,
): {
  empresa?: EmpresaProdutoApi;
  tipo?: TipoProduto;
  ean?: 'com' | 'sem';
  dum?: 'com' | 'sem';
} {
  return {
    empresa: filtros.empresa === 'todos' ? undefined : filtros.empresa,
    tipo: filtros.tipo === 'todos' ? undefined : filtros.tipo,
    ean: filtros.ean === 'todos' ? undefined : filtros.ean,
    dum: filtros.dum === 'todos' ? undefined : filtros.dum,
  };
}
