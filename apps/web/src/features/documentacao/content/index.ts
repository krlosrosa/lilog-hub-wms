import { inventarioContent } from './inventario';
import { produtosContent } from './produtos';
import { recebimentoContent } from './recebimento';
import { unidadesContent } from './unidades';

import type { DocModuloContent, DocModuloSlug } from '../types';

export const DOC_MODULOS: DocModuloContent[] = [
  unidadesContent,
  produtosContent,
  recebimentoContent,
  inventarioContent,
];

export const DOC_MODULOS_BY_SLUG: Record<DocModuloSlug, DocModuloContent> = {
  unidades: unidadesContent,
  produtos: produtosContent,
  recebimento: recebimentoContent,
  inventario: inventarioContent,
};

export const DOC_FLUXO_SUGERIDO: DocModuloSlug[] = [
  'unidades',
  'produtos',
  'recebimento',
  'inventario',
];

export function isDocModuloSlug(value: string): value is DocModuloSlug {
  return value in DOC_MODULOS_BY_SLUG;
}

export function getDocModulo(slug: string): DocModuloContent | undefined {
  if (!isDocModuloSlug(slug)) {
    return undefined;
  }

  return DOC_MODULOS_BY_SLUG[slug];
}
