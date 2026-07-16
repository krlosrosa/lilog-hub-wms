import type { ItemPreRecebimentoRecord } from '../repositories/recebimento/pre-recebimento.repository.js';
import type { ItemRecebimentoRecord } from '../repositories/recebimento/recebimento.repository.js';
import type { ProdutoRecord } from '../repositories/produto/produto.repository.js';
import { toBaseUnits } from './unidade-medida.js';

export type EsperadoPorProdutoAgregado = {
  totalUN: number;
  unidadesPorCaixa: number;
  pesoEsperadoEfetivo: number | null;
  loteEsperado: string | null;
  validadeEsperada: Date | null;
  pesoEsperado: number | null;
};

export type RecebidoPorProdutoAgregado = {
  totalUN: number;
  unidadesPorCaixa: number;
  pesoRecebido: number | null;
  loteRecebido: string | null;
  validadeRecebida: Date | null;
};

export function resolveUnidadesPorCaixa(
  produtoId: string,
  produtos: Map<string, ProdutoRecord>,
  itensEsperados: ItemPreRecebimentoRecord[],
): number {
  const fromProduto = produtos.get(produtoId)?.unidadesPorCaixa;

  if (fromProduto) {
    return fromProduto;
  }

  const esperado = itensEsperados.find((item) => item.produtoId === produtoId);

  return esperado?.unidadesPorCaixa ?? 1;
}

function resolvePesoEsperadoEfetivo(
  esperado: ItemPreRecebimentoRecord,
  esperadoUN: number,
  produto: ProdutoRecord | undefined,
): number | null {
  if (esperado.pesoEsperado !== null) {
    return esperado.pesoEsperado;
  }

  const isPvar = produto?.tipo === 'PVAR';

  if (isPvar && produto?.pesoBrutoUnidade) {
    return esperadoUN * Number(produto.pesoBrutoUnidade);
  }

  return null;
}

export function agregarEsperadoPorProdutoEmUN(
  itens: ItemPreRecebimentoRecord[],
  produtos: Map<string, ProdutoRecord>,
): Map<string, EsperadoPorProdutoAgregado> {
  const map = new Map<string, EsperadoPorProdutoAgregado>();

  for (const item of itens) {
    const unidadesPorCaixa =
      produtos.get(item.produtoId)?.unidadesPorCaixa ?? item.unidadesPorCaixa;
    const quantidadeUN = toBaseUnits(
      item.quantidadeEsperada,
      item.unidadeMedida,
      unidadesPorCaixa,
    );
    const produto = produtos.get(item.produtoId);
    const existing = map.get(item.produtoId);

    if (!existing) {
      map.set(item.produtoId, {
        totalUN: quantidadeUN,
        unidadesPorCaixa,
        pesoEsperadoEfetivo: resolvePesoEsperadoEfetivo(
          item,
          quantidadeUN,
          produto,
        ),
        loteEsperado: item.loteEsperado ?? null,
        validadeEsperada: item.validadeEsperada ?? null,
        pesoEsperado: item.pesoEsperado ?? null,
      });
      continue;
    }

    const totalUN = existing.totalUN + quantidadeUN;
    const pesoFromLine = resolvePesoEsperadoEfetivo(item, quantidadeUN, produto);

    map.set(item.produtoId, {
      totalUN,
      unidadesPorCaixa: existing.unidadesPorCaixa,
      pesoEsperadoEfetivo:
        existing.pesoEsperadoEfetivo !== null && pesoFromLine !== null
          ? existing.pesoEsperadoEfetivo + pesoFromLine
          : (pesoFromLine ?? existing.pesoEsperadoEfetivo),
      loteEsperado: existing.loteEsperado ?? item.loteEsperado ?? null,
      validadeEsperada: existing.validadeEsperada ?? item.validadeEsperada ?? null,
      pesoEsperado: existing.pesoEsperado ?? item.pesoEsperado ?? null,
    });
  }

  return map;
}

export function agregarRecebidoPorProdutoEmUN(
  itens: ItemRecebimentoRecord[],
  produtos: Map<string, ProdutoRecord>,
  itensEsperados: ItemPreRecebimentoRecord[],
): Map<string, RecebidoPorProdutoAgregado> {
  const map = new Map<string, RecebidoPorProdutoAgregado>();

  for (const item of itens) {
    const unidadesPorCaixa = resolveUnidadesPorCaixa(
      item.produtoId,
      produtos,
      itensEsperados,
    );
    const quantidadeUN = toBaseUnits(
      item.quantidadeRecebida,
      item.unidadeMedida,
      unidadesPorCaixa,
    );
    const existing = map.get(item.produtoId);

    if (!existing) {
      map.set(item.produtoId, {
        totalUN: quantidadeUN,
        unidadesPorCaixa,
        pesoRecebido: item.pesoRecebido,
        loteRecebido: item.loteRecebido ?? null,
        validadeRecebida: item.validade ?? null,
      });
      continue;
    }

    map.set(item.produtoId, {
      totalUN: existing.totalUN + quantidadeUN,
      unidadesPorCaixa: existing.unidadesPorCaixa,
      pesoRecebido:
        existing.pesoRecebido !== null && item.pesoRecebido !== null
          ? existing.pesoRecebido + item.pesoRecebido
          : (item.pesoRecebido ?? existing.pesoRecebido),
      loteRecebido: existing.loteRecebido ?? item.loteRecebido ?? null,
      validadeRecebida: existing.validadeRecebida ?? item.validade ?? null,
    });
  }

  return map;
}
