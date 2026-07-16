import { createHash } from 'node:crypto';

import { PESO_DIVERGENCIA_TOLERANCIA } from '../model/recebimento/recebimento.model.js';
import type { CncResponsavel, CncSubtipoOcorrencia } from '../model/cnc/cnc.model.js';
import type { CreateCncItemInput } from '../repositories/cnc/cnc.repository.js';
import type { ItemPreRecebimentoRecord } from '../repositories/recebimento/pre-recebimento.repository.js';
import type { RecebimentoAvariaRecord } from '../repositories/recebimento/recebimento-avaria.repository.js';
import type { ItemRecebimentoRecord } from '../repositories/recebimento/recebimento.repository.js';
import type { ProdutoRecord } from '../repositories/produto/produto.repository.js';
import {
  agregarEsperadoPorProdutoEmUN,
  agregarRecebidoPorProdutoEmUN,
} from './agregar-quantidades-por-produto.js';
import { inferFromAvariaNatureza } from './cnc-responsavel.js';
import {
  DEFAULT_DISPLAY_QUANTIDADE_CONFIG,
  type DisplayQuantidadeConfig,
  fromBaseUnitsForDisplayNullable,
} from './unidade-medida.js';

function inferResponsavelDivergencia(): CncResponsavel {
  return 'fornecedor';
}

function calcularQuantidadeDivergente(
  subtipo: CncSubtipoOcorrencia,
  esperadaUN: number,
  recebidaUN: number,
): number | null {
  if (subtipo === 'falta') {
    return Math.max(0, esperadaUN - recebidaUN);
  }

  if (subtipo === 'sobra' || subtipo === 'produto_nao_previsto') {
    return Math.max(0, recebidaUN - esperadaUN);
  }

  if (subtipo === 'peso_divergente') {
    return null;
  }

  return null;
}

export function buildReferenciaIdCncQuantidade(
  recebimentoId: string,
  produtoId: string,
  subtipo: CncSubtipoOcorrencia,
): string {
  const hash = createHash('sha256')
    .update(`${recebimentoId}|${produtoId}|${subtipo}`)
    .digest('hex');

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}

function calcularQuantidadeAvariaUN(
  avaria: RecebimentoAvariaRecord,
  produtos: Map<string, ProdutoRecord>,
): number {
  const unidadesPorCaixa = avaria.produtoId
    ? (produtos.get(avaria.produtoId)?.unidadesPorCaixa ?? 1)
    : 1;

  return (
    avaria.quantidadeUnidades + avaria.quantidadeCaixas * unidadesPorCaixa
  );
}

function resolveProduto(
  produtoId: string | null,
  produtos: Map<string, ProdutoRecord>,
): Pick<
  CreateCncItemInput,
  'produtoId' | 'sku' | 'descricaoProduto' | 'shelfLifeDias'
> {
  if (!produtoId) {
    return {
      produtoId: null,
      sku: null,
      descricaoProduto: null,
      shelfLifeDias: null,
    };
  }

  const produto = produtos.get(produtoId);

  return {
    produtoId,
    sku: produto?.sku ?? null,
    descricaoProduto: produto?.descricao ?? null,
    shelfLifeDias: produto?.shelfLife ?? null,
  };
}

function aplicarDisplayQuantidade(
  qtdBaseUN: number | null,
  unidadesPorCaixa: number | null | undefined,
  displayConfig: DisplayQuantidadeConfig,
): {
  valor: number | null;
  unidade: string | null;
} {
  const display = fromBaseUnitsForDisplayNullable(
    qtdBaseUN,
    unidadesPorCaixa,
    displayConfig,
  );

  return {
    valor: display.valor,
    unidade: display.unidade,
  };
}

function buildDescricaoDetalheQuantidade(subtipo: CncSubtipoOcorrencia): string {
  switch (subtipo) {
    case 'falta':
      return 'Quantidade recebida abaixo da prevista';
    case 'sobra':
      return 'Quantidade recebida acima da prevista';
    case 'produto_nao_previsto':
      return 'SKU não informado no pré-recebimento';
    case 'peso_divergente':
      return 'Peso recebido divergente do previsto';
    default:
      return 'Divergência identificada na conferência';
  }
}

function montarItemQuantidade(input: {
  recebimentoId: string;
  produtoId: string;
  subtipo: CncSubtipoOcorrencia;
  esperadoUN: number;
  recebidoUN: number;
  unidadesPorCaixa: number;
  produtos: Map<string, ProdutoRecord>;
  displayConfig: DisplayQuantidadeConfig;
  loteEsperado: string | null;
  loteRecebido: string | null;
  validadeEsperada: Date | null;
  validadeRecebida: Date | null;
  pesoEsperado: number | null;
  pesoRecebido: number | null;
}): CreateCncItemInput {
  const quantidadeDivergenteBaseUN = calcularQuantidadeDivergente(
    input.subtipo,
    input.esperadoUN,
    input.recebidoUN,
  );

  const quantidadeEsperadaDisplay = aplicarDisplayQuantidade(
    input.esperadoUN,
    input.unidadesPorCaixa,
    input.displayConfig,
  );
  const quantidadeRecebidaDisplay = aplicarDisplayQuantidade(
    input.recebidoUN,
    input.unidadesPorCaixa,
    input.displayConfig,
  );
  const quantidadeDivergenteDisplay = aplicarDisplayQuantidade(
    quantidadeDivergenteBaseUN,
    input.unidadesPorCaixa,
    input.displayConfig,
  );

  return {
    tipo: 'divergencia',
    referenciaId: buildReferenciaIdCncQuantidade(
      input.recebimentoId,
      input.produtoId,
      input.subtipo,
    ),
    subtipoOcorrencia: input.subtipo,
    ...resolveProduto(input.produtoId, input.produtos),
    quantidadeEsperada: quantidadeEsperadaDisplay.valor,
    quantidadeRecebida: quantidadeRecebidaDisplay.valor,
    quantidadeDivergente: quantidadeDivergenteDisplay.valor,
    unidadeMedida:
      quantidadeEsperadaDisplay.unidade ??
      quantidadeRecebidaDisplay.unidade ??
      quantidadeDivergenteDisplay.unidade,
    loteEsperado: input.loteEsperado,
    loteRecebido: input.loteRecebido,
    validadeEsperada: input.validadeEsperada,
    validadeRecebida: input.validadeRecebida,
    pesoEsperado: input.pesoEsperado,
    pesoRecebido: input.pesoRecebido,
    causaAvaria: input.subtipo === 'falta' ? '88' : null,
    descricaoDetalhe: buildDescricaoDetalheQuantidade(input.subtipo),
    responsavelSugerido: inferResponsavelDivergencia(),
  };
}

export type MontarItensCncRecebimentoInput = {
  recebimentoId: string;
  itensEsperados: ItemPreRecebimentoRecord[];
  itensRecebidos: ItemRecebimentoRecord[];
  avarias: RecebimentoAvariaRecord[];
  produtos: Map<string, ProdutoRecord>;
  displayConfig?: DisplayQuantidadeConfig;
};

function montarItensQuantidadePorProduto(
  input: MontarItensCncRecebimentoInput,
  displayConfig: DisplayQuantidadeConfig,
): CreateCncItemInput[] {
  const esperados = agregarEsperadoPorProdutoEmUN(
    input.itensEsperados,
    input.produtos,
  );
  const recebidos = agregarRecebidoPorProdutoEmUN(
    input.itensRecebidos,
    input.produtos,
    input.itensEsperados,
  );
  const produtoIds = new Set([...esperados.keys(), ...recebidos.keys()]);
  const itens: CreateCncItemInput[] = [];

  for (const produtoId of produtoIds) {
    const esperado = esperados.get(produtoId);
    const recebido = recebidos.get(produtoId);
    const produto = input.produtos.get(produtoId);
    const isPvar = produto?.tipo === 'PVAR';
    const esperadoUN = esperado?.totalUN ?? 0;
    const recebidoUN = recebido?.totalUN ?? 0;
    const unidadesPorCaixa =
      esperado?.unidadesPorCaixa ??
      recebido?.unidadesPorCaixa ??
      produto?.unidadesPorCaixa ??
      1;

    const metadata = {
      loteEsperado: esperado?.loteEsperado ?? null,
      loteRecebido: recebido?.loteRecebido ?? null,
      validadeEsperada: esperado?.validadeEsperada ?? null,
      validadeRecebida: recebido?.validadeRecebida ?? null,
      pesoEsperado: esperado?.pesoEsperadoEfetivo ?? null,
      pesoRecebido: recebido?.pesoRecebido ?? null,
    };

    if (isPvar) {
      if (
        metadata.pesoEsperado !== null &&
        metadata.pesoRecebido !== null &&
        Math.abs(metadata.pesoEsperado - metadata.pesoRecebido) >
          PESO_DIVERGENCIA_TOLERANCIA
      ) {
        itens.push(
          montarItemQuantidade({
            recebimentoId: input.recebimentoId,
            produtoId,
            subtipo: 'peso_divergente',
            esperadoUN,
            recebidoUN,
            unidadesPorCaixa,
            produtos: input.produtos,
            displayConfig,
            ...metadata,
          }),
        );
      }

      continue;
    }

    if (esperadoUN === 0 && recebidoUN > 0) {
      itens.push(
        montarItemQuantidade({
          recebimentoId: input.recebimentoId,
          produtoId,
          subtipo: 'produto_nao_previsto',
          esperadoUN: 0,
          recebidoUN,
          unidadesPorCaixa,
          produtos: input.produtos,
          displayConfig,
          ...metadata,
        }),
      );
      continue;
    }

    if (esperadoUN > 0 && recebidoUN === 0) {
      itens.push(
        montarItemQuantidade({
          recebimentoId: input.recebimentoId,
          produtoId,
          subtipo: 'falta',
          esperadoUN,
          recebidoUN: 0,
          unidadesPorCaixa,
          produtos: input.produtos,
          displayConfig,
          ...metadata,
        }),
      );
      continue;
    }

    const diffUN = recebidoUN - esperadoUN;

    if (diffUN > 0) {
      itens.push(
        montarItemQuantidade({
          recebimentoId: input.recebimentoId,
          produtoId,
          subtipo: 'sobra',
          esperadoUN,
          recebidoUN,
          unidadesPorCaixa,
          produtos: input.produtos,
          displayConfig,
          ...metadata,
        }),
      );
    } else if (diffUN < 0) {
      itens.push(
        montarItemQuantidade({
          recebimentoId: input.recebimentoId,
          produtoId,
          subtipo: 'falta',
          esperadoUN,
          recebidoUN,
          unidadesPorCaixa,
          produtos: input.produtos,
          displayConfig,
          ...metadata,
        }),
      );
    }
  }

  return itens;
}

function montarItensAvaria(
  input: MontarItensCncRecebimentoInput,
  displayConfig: DisplayQuantidadeConfig,
): CreateCncItemInput[] {
  const esperadosPorProduto = new Map(
    input.itensEsperados.map((item) => [item.produtoId, item]),
  );
  const recebidosAgregados = agregarRecebidoPorProdutoEmUN(
    input.itensRecebidos,
    input.produtos,
    input.itensEsperados,
  );
  const itens: CreateCncItemInput[] = [];

  for (const avaria of input.avarias) {
    const recebido = avaria.produtoId
      ? recebidosAgregados.get(avaria.produtoId)
      : undefined;
    const esperado = avaria.produtoId
      ? esperadosPorProduto.get(avaria.produtoId)
      : undefined;
    const produto = avaria.produtoId
      ? input.produtos.get(avaria.produtoId)
      : undefined;
    const unidadesPorCaixa = produto?.unidadesPorCaixa ?? 1;

    const quantidadeDivergenteBaseUN = calcularQuantidadeAvariaUN(
      avaria,
      input.produtos,
    );
    const quantidadeDivergenteDisplay = aplicarDisplayQuantidade(
      quantidadeDivergenteBaseUN,
      unidadesPorCaixa,
      displayConfig,
    );

    itens.push({
      tipo: 'avaria',
      referenciaId: avaria.id,
      subtipoOcorrencia: 'avaria',
      ...resolveProduto(avaria.produtoId, input.produtos),
      quantidadeCaixas: avaria.quantidadeCaixas,
      quantidadeUnidades: avaria.quantidadeUnidades,
      quantidadeDivergente: quantidadeDivergenteDisplay.valor,
      unidadeMedida:
        quantidadeDivergenteDisplay.valor !== null
          ? quantidadeDivergenteDisplay.unidade
          : null,
      loteEsperado: esperado?.loteEsperado ?? null,
      loteRecebido: recebido?.loteRecebido ?? null,
      validadeEsperada: esperado?.validadeEsperada ?? null,
      validadeRecebida: recebido?.validadeRecebida ?? null,
      naturezaAvaria: avaria.natureza,
      causaAvaria: avaria.causa,
      tipoAvaria: avaria.tipo,
      descricaoDetalhe: `${avaria.tipo} · ${avaria.natureza} · ${avaria.causa}`,
      responsavelSugerido: inferFromAvariaNatureza(avaria.natureza),
    });
  }

  return itens;
}

export function montarItensCncRecebimento(
  input: MontarItensCncRecebimentoInput,
): CreateCncItemInput[] {
  const displayConfig =
    input.displayConfig ?? DEFAULT_DISPLAY_QUANTIDADE_CONFIG;

  return [
    ...montarItensQuantidadePorProduto(input, displayConfig),
    ...montarItensAvaria(input, displayConfig),
  ];
}

export function montarDescricaoCnc(itens: CreateCncItemInput[]): string {
  const resumo = itens.reduce(
    (acc, item) => {
      const key = item.subtipoOcorrencia ?? 'outros';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const partes = Object.entries(resumo).map(([tipo, qtd]) => `${qtd} ${tipo}`);

  return `CNC gerada automaticamente (${partes.join(', ')})`;
}
