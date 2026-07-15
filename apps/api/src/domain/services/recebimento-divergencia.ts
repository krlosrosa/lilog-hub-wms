import {
  PESO_DIVERGENCIA_TOLERANCIA,
  type TipoDivergencia,
} from '../model/recebimento/recebimento.model.js';
import type { ItemPreRecebimentoRecord } from '../repositories/recebimento/pre-recebimento.repository.js';
import type {
  CreateDivergenciaInput,
  ItemRecebimentoRecord,
} from '../repositories/recebimento/recebimento.repository.js';
import type { ProdutoRecord } from '../repositories/produto/produto.repository.js';
import { toBaseUnits } from './unidade-medida.js';

export type DivergenciaCalculada = Omit<CreateDivergenciaInput, 'recebimentoId'>;

function aggregateQuantidadeByProduto(
  itens: ItemRecebimentoRecord[],
): Map<string, ItemRecebimentoRecord> {
  const map = new Map<string, ItemRecebimentoRecord>();

  for (const item of itens) {
    const existing = map.get(item.produtoId);

    if (!existing) {
      map.set(item.produtoId, { ...item });
      continue;
    }

    map.set(item.produtoId, {
      ...existing,
      quantidadeRecebida:
        existing.quantidadeRecebida + item.quantidadeRecebida,
      pesoRecebido:
        existing.pesoRecebido !== null && item.pesoRecebido !== null
          ? existing.pesoRecebido + item.pesoRecebido
          : (item.pesoRecebido ?? existing.pesoRecebido),
    });
  }

  return map;
}

function aggregateQuantidadeEsperadaByProduto(
  itens: ItemPreRecebimentoRecord[],
  produtos: Map<string, ProdutoRecord>,
): Map<string, number> {
  const map = new Map<string, number>();

  for (const item of itens) {
    const unidadesPorCaixa =
      produtos.get(item.produtoId)?.unidadesPorCaixa ?? item.unidadesPorCaixa;
    const quantidadeUN = toBaseUnits(
      item.quantidadeEsperada,
      item.unidadeMedida,
      unidadesPorCaixa,
    );

    map.set(item.produtoId, (map.get(item.produtoId) ?? 0) + quantidadeUN);
  }

  return map;
}

function resolveUnidadesPorCaixa(
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

export function calcularDivergencias(
  itensEsperados: ItemPreRecebimentoRecord[],
  itensRecebidos: ItemRecebimentoRecord[],
  produtos: Map<string, ProdutoRecord> = new Map(),
): DivergenciaCalculada[] {
  const divergencias: DivergenciaCalculada[] = [];
  const recebidosPorProduto = aggregateQuantidadeByProduto(itensRecebidos);
  const esperadosPorProduto = aggregateQuantidadeEsperadaByProduto(
    itensEsperados,
    produtos,
  );
  const esperadosIds = new Set(itensEsperados.map((item) => item.produtoId));

  for (const produtoId of esperadosIds) {
    const recebido = recebidosPorProduto.get(produtoId);
    const esperadoUN = esperadosPorProduto.get(produtoId) ?? 0;

    if (!recebido) {
      divergencias.push({
        produtoId,
        tipoDivergencia: 'produto_ausente',
        quantidadeEsperada: esperadoUN,
        quantidadeRecebida: 0,
        descricao: 'SKU esperado não encontrado na conferência',
      });
      continue;
    }

    const unidadesPorCaixa = resolveUnidadesPorCaixa(
      produtoId,
      produtos,
      itensEsperados,
    );
    const recebidoUN = toBaseUnits(
      recebido.quantidadeRecebida,
      recebido.unidadeMedida,
      unidadesPorCaixa,
    );

    if (recebidoUN > esperadoUN) {
      divergencias.push({
        produtoId,
        tipoDivergencia: 'quantidade_maior',
        quantidadeEsperada: esperadoUN,
        quantidadeRecebida: recebidoUN,
        descricao: 'Quantidade recebida acima da prevista',
      });
    } else if (recebidoUN < esperadoUN) {
      divergencias.push({
        produtoId,
        tipoDivergencia: 'quantidade_menor',
        quantidadeEsperada: esperadoUN,
        quantidadeRecebida: recebidoUN,
        descricao: 'Quantidade recebida abaixo da prevista',
      });
    }
  }

  for (const esperado of itensEsperados) {
    const produto = produtos.get(esperado.produtoId);
    const isPvar = produto?.tipo === 'PVAR';
    const recebido = recebidosPorProduto.get(esperado.produtoId);

    if (!recebido) {
      continue;
    }

    const esperadoUN = toBaseUnits(
      esperado.quantidadeEsperada,
      esperado.unidadeMedida,
      esperado.unidadesPorCaixa,
    );

    if (
      esperado.loteEsperado &&
      recebido.loteRecebido &&
      esperado.loteEsperado !== recebido.loteRecebido
    ) {
      divergencias.push({
        produtoId: esperado.produtoId,
        tipoDivergencia: 'divergencia_lote',
        descricao: `Lote esperado ${esperado.loteEsperado}, recebido ${recebido.loteRecebido}`,
      });
    }

    if (isPvar && recebido.pesoRecebido !== null) {
      const pesoEsperadoEfetivo = resolvePesoEsperadoEfetivo(
        esperado,
        esperadoUN,
        produto,
      );

      if (
        pesoEsperadoEfetivo !== null &&
        Math.abs(pesoEsperadoEfetivo - recebido.pesoRecebido) >
          PESO_DIVERGENCIA_TOLERANCIA
      ) {
        divergencias.push({
          produtoId: esperado.produtoId,
          tipoDivergencia: 'divergencia_peso',
          descricao: `Peso esperado ${pesoEsperadoEfetivo}, recebido ${recebido.pesoRecebido}`,
        });
      }
    }

    if (
      esperado.validadeEsperada &&
      recebido.validade &&
      esperado.validadeEsperada.getTime() !== recebido.validade.getTime()
    ) {
      divergencias.push({
        produtoId: esperado.produtoId,
        tipoDivergencia: 'divergencia_validade',
        descricao: 'Validade recebida diferente da prevista',
      });
    }
  }

  for (const [produtoId] of recebidosPorProduto) {
    if (!esperadosIds.has(produtoId)) {
      const recebido = recebidosPorProduto.get(produtoId)!;
      const unidadesPorCaixa = resolveUnidadesPorCaixa(
        produtoId,
        produtos,
        itensEsperados,
      );

      divergencias.push({
        produtoId,
        tipoDivergencia: 'produto_nao_esperado',
        quantidadeRecebida: toBaseUnits(
          recebido.quantidadeRecebida,
          recebido.unidadeMedida,
          unidadesPorCaixa,
        ),
        descricao: 'SKU não informado no pré-recebimento',
      });
    }
  }

  return divergencias;
}

export function hasDivergenciaTipo(
  divergencias: DivergenciaCalculada[],
  tipo: TipoDivergencia,
): boolean {
  return divergencias.some((item) => item.tipoDivergencia === tipo);
}
