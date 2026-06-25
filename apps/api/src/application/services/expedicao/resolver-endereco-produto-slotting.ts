import type { ProdutoEnderecoPapel } from '../../../domain/model/produto-endereco/produto-endereco.model.js';
import type { ProdutoEnderecoSlottingRow } from '../../../infra/db/produto-endereco/list-produto-enderecos-by-produto-ids.drizzle.js';
import type { EnderecoItemMapa } from './endereco-item-mapa.js';

const PAPEL_PRIORIDADE: Record<ProdutoEnderecoPapel, number> = {
  picking_primario: 0,
  picking_secundario: 1,
  pulmao: 2,
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isProdutoUuid(value: string | null | undefined): value is string {
  if (!value?.trim()) {
    return false;
  }

  return UUID_REGEX.test(value.trim());
}

export function normalizarChaveProdutoSlotting(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return isProdutoUuid(trimmed) ? trimmed.toLowerCase() : trimmed;
}

function rowParaEnderecoItemMapa(row: ProdutoEnderecoSlottingRow): EnderecoItemMapa {
  return {
    endereco: row.enderecoMascarado,
    enderecoId: row.enderecoId,
    zona: row.zona,
    rua: row.rua,
    posicao: row.posicao,
    nivel: row.nivel,
    prioridadePicking: row.prioridadePicking,
    slottingOrdem: row.ordem,
    slottingPapel: row.papel,
  };
}

function compararAlocacao(
  a: ProdutoEnderecoSlottingRow,
  b: ProdutoEnderecoSlottingRow,
): number {
  if (a.ativo !== b.ativo) {
    return a.ativo ? -1 : 1;
  }

  const prioridadePapel =
    PAPEL_PRIORIDADE[a.papel] - PAPEL_PRIORIDADE[b.papel];
  if (prioridadePapel !== 0) {
    return prioridadePapel;
  }

  return a.ordem - b.ordem;
}

export function resolverEnderecoProdutoSlotting(
  alocacoes: ProdutoEnderecoSlottingRow[],
): EnderecoItemMapa | null {
  if (alocacoes.length === 0) {
    return null;
  }

  const melhor = [...alocacoes].sort(compararAlocacao)[0];
  if (!melhor) {
    return null;
  }

  return rowParaEnderecoItemMapa(melhor);
}

function registrarChave(
  mapa: Map<string, ProdutoEnderecoSlottingRow[]>,
  chave: string | null | undefined,
  row: ProdutoEnderecoSlottingRow,
) {
  const valor = normalizarChaveProdutoSlotting(chave);
  if (!valor) {
    return;
  }

  const atual = mapa.get(valor) ?? [];
  atual.push(row);
  mapa.set(valor, atual);
}

export function montarMapaEnderecoPorProdutoCodigo(
  rows: ProdutoEnderecoSlottingRow[],
): Map<string, EnderecoItemMapa | null> {
  const porChave = new Map<string, ProdutoEnderecoSlottingRow[]>();

  rows.forEach((row) => {
    registrarChave(porChave, row.produtoUuid, row);
    registrarChave(porChave, row.produtoCodigo, row);
    registrarChave(porChave, row.produtoSku, row);
  });

  const resultado = new Map<string, EnderecoItemMapa | null>();

  porChave.forEach((alocacoes, chave) => {
    resultado.set(chave, resolverEnderecoProdutoSlotting(alocacoes));
  });

  return resultado;
}

export function resolverEnderecoItemMapa(input: {
  produtoUuid: string | null;
  produtoCodigo: string;
  sku: string;
  enderecoPorProdutoCodigo: Map<string, EnderecoItemMapa | null>;
}): EnderecoItemMapa | null {
  const chaves = [
    normalizarChaveProdutoSlotting(input.produtoUuid),
    normalizarChaveProdutoSlotting(input.produtoCodigo),
    normalizarChaveProdutoSlotting(input.sku),
  ].filter((chave): chave is string => Boolean(chave));

  for (const chave of chaves) {
    const endereco = input.enderecoPorProdutoCodigo.get(chave);
    if (endereco) {
      return endereco;
    }
  }

  return null;
}

export function coletarProdutoUuidsParaSlotting(input: {
  produtoId: string | null;
  produtoIdResolvido: string | null;
  produtoCodigo: string;
  sku: string;
}): string[] {
  return [
    ...new Set(
      [
        input.produtoIdResolvido,
        input.produtoId,
        input.produtoCodigo,
        input.sku,
      ]
        .map(normalizarChaveProdutoSlotting)
        .filter(isProdutoUuid),
    ),
  ];
}
