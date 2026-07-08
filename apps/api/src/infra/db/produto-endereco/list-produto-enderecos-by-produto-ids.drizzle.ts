import { and, eq, inArray, or, type SQL } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  enderecos,
  produtoEnderecos,
  produtos,
} from '../providers/drizzle/config/migrations/schema.js';

export type ProdutoEnderecoSlottingRow = {
  produtoId: string;
  produtoCodigo: string;
  produtoSku: string;
  enderecoId: string;
  papel: 'picking_primario' | 'picking_secundario' | 'pulmao';
  ordem: number;
  ativo: boolean;
  enderecoMascarado: string;
  zona: string;
  rua: string;
  posicao: string;
  nivel: string;
  prioridadePicking: number | null;
};

export async function listProdutoEnderecosByProdutoIdsDb(
  db: DrizzleClient,
  input: {
    unidadeId: string;
    produtoIds?: string[];
    produtoCodigos?: string[];
    ativo?: boolean;
  },
): Promise<ProdutoEnderecoSlottingRow[]> {
  const produtoIds = [
    ...new Set(
      (input.produtoIds ?? [])
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
  const produtoCodigos = [
    ...new Set((input.produtoCodigos ?? []).map((codigo) => codigo.trim()).filter(Boolean)),
  ];

  if (produtoIds.length === 0 && produtoCodigos.length === 0) {
    return [];
  }

  const produtoFilters: SQL[] = [];

  if (produtoIds.length > 0) {
    produtoFilters.push(inArray(produtos.produtoId, produtoIds));
  }

  if (produtoCodigos.length > 0) {
    produtoFilters.push(inArray(produtos.produtoId, produtoCodigos));
    produtoFilters.push(inArray(produtos.sku, produtoCodigos));
  }

  const conditions: SQL[] = [
    eq(centros.unidadeId, input.unidadeId),
    produtoFilters.length === 1
      ? produtoFilters[0]!
      : or(...produtoFilters)!,
  ];

  if (input.ativo !== undefined) {
    conditions.push(eq(produtoEnderecos.ativo, input.ativo));
  }

  return db
    .select({
      produtoId: produtoEnderecos.produtoId,
      produtoCodigo: produtos.produtoId,
      produtoSku: produtos.sku,
      enderecoId: produtoEnderecos.enderecoId,
      papel: produtoEnderecos.papel,
      ordem: produtoEnderecos.ordem,
      ativo: produtoEnderecos.ativo,
      enderecoMascarado: enderecos.enderecoMascarado,
      zona: enderecos.zona,
      rua: enderecos.rua,
      posicao: enderecos.posicao,
      nivel: enderecos.nivel,
      prioridadePicking: enderecos.prioridadePicking,
    })
    .from(produtoEnderecos)
    .innerJoin(produtos, eq(produtoEnderecos.produtoId, produtos.produtoId))
    .innerJoin(enderecos, eq(produtoEnderecos.enderecoId, enderecos.id))
    .innerJoin(centros, eq(produtoEnderecos.centroId, centros.id))
    .where(and(...conditions));
}
