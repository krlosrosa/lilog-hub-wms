import { and, eq, inArray, or, type SQL } from 'drizzle-orm';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  centros,
  enderecos,
  produtoEnderecos,
  produtos,
} from '../providers/drizzle/config/migrations/schema.js';

export type ProdutoEnderecoSlottingRow = {
  produtoUuid: string;
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
    produtoUuids?: string[];
    produtoCodigos?: string[];
    ativo?: boolean;
  },
): Promise<ProdutoEnderecoSlottingRow[]> {
  const produtoUuids = [
    ...new Set(
      (input.produtoUuids ?? [])
        .map((id) => id.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  const produtoCodigos = [
    ...new Set((input.produtoCodigos ?? []).map((codigo) => codigo.trim()).filter(Boolean)),
  ];

  if (produtoUuids.length === 0 && produtoCodigos.length === 0) {
    return [];
  }

  const produtoFilters: SQL[] = [];

  if (produtoUuids.length > 0) {
    produtoFilters.push(inArray(produtos.id, produtoUuids));
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
      produtoUuid: produtoEnderecos.produtoId,
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
    .innerJoin(produtos, eq(produtoEnderecos.produtoId, produtos.id))
    .innerJoin(enderecos, eq(produtoEnderecos.enderecoId, enderecos.id))
    .innerJoin(centros, eq(produtoEnderecos.centroId, centros.id))
    .where(and(...conditions));
}
