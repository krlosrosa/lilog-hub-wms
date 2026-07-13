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
  const esperadosIds = new Set(itensEsperados.map((item) => item.produtoId));

  for (const esperado of itensEsperados) {
    const produto = produtos.get(esperado.produtoId);
    const isPvar = produto?.tipo === 'PVAR';
    const recebido = recebidosPorProduto.get(esperado.produtoId);

    if (!recebido) {
      divergencias.push({
        produtoId: esperado.produtoId,
        tipoDivergencia: 'produto_ausente',
        quantidadeEsperada: toBaseUnits(
          esperado.quantidadeEsperada,
          esperado.unidadeMedida,
          esperado.unidadesPorCaixa,
        ),
        quantidadeRecebida: 0,
        descricao: 'SKU esperado não encontrado na conferência',
      });
      continue;
    }

    const esperadoUN = toBaseUnits(
      esperado.quantidadeEsperada,
      esperado.unidadeMedida,
      esperado.unidadesPorCaixa,
    );
    const recebidoUN = toBaseUnits(
      recebido.quantidadeRecebida,
      recebido.unidadeMedida,
      esperado.unidadesPorCaixa,
    );

    if (recebidoUN > esperadoUN) {
      divergencias.push({
        produtoId: esperado.produtoId,
        tipoDivergencia: 'quantidade_maior',
        quantidadeEsperada: esperadoUN,
        quantidadeRecebida: recebidoUN,
        descricao: 'Quantidade recebida acima da prevista',
      });
    } else if (recebidoUN < esperadoUN) {
      divergencias.push({
        produtoId: esperado.produtoId,
        tipoDivergencia: 'quantidade_menor',
        quantidadeEsperada: esperadoUN,
        quantidadeRecebida: recebidoUN,
        descricao: 'Quantidade recebida abaixo da prevista',
      });
    }

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

    if (
      isPvar &&
      recebido.pesoRecebido !== null
    ) {
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
      const unidadesPorCaixa =
        produtos.get(produtoId)?.unidadesPorCaixa ?? 1;

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
