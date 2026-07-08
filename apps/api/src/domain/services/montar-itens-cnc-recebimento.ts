import type { CncResponsavel, CncSubtipoOcorrencia } from '../model/cnc/cnc.model.js';
import type { TipoDivergencia } from '../model/recebimento/recebimento.model.js';
import type { CreateCncItemInput } from '../repositories/cnc/cnc.repository.js';
import type { ItemPreRecebimentoRecord } from '../repositories/recebimento/pre-recebimento.repository.js';
import type { RecebimentoAvariaRecord } from '../repositories/recebimento/recebimento-avaria.repository.js';
import type {
  DivergenciaRecebimentoRecord,
  ItemRecebimentoRecord,
} from '../repositories/recebimento/recebimento.repository.js';
import type { ProdutoRecord } from '../repositories/produto/produto.repository.js';
import { inferFromAvariaNatureza } from './cnc-responsavel.js';

const SUBTIPOS_EXCLUIDOS_CNC = new Set<CncSubtipoOcorrencia>([
  'lote_divergente',
  'peso_divergente',
  'validade_divergente',
]);

function mapTipoDivergenciaToSubtipo(
  tipo: TipoDivergencia,
): CncSubtipoOcorrencia {
  switch (tipo) {
    case 'quantidade_menor':
    case 'produto_ausente':
      return 'falta';
    case 'quantidade_maior':
      return 'sobra';
    case 'produto_nao_esperado':
      return 'produto_nao_previsto';
    case 'divergencia_lote':
      return 'lote_divergente';
    case 'divergencia_peso':
      return 'peso_divergente';
    case 'divergencia_validade':
      return 'validade_divergente';
    default:
      return 'falta';
  }
}

function inferResponsavelDivergencia(): CncResponsavel {
  return 'fornecedor';
}

function calcularQuantidadeDivergente(
  subtipo: CncSubtipoOcorrencia,
  esperada: number | null,
  recebida: number | null,
): number | null {
  if (subtipo === 'falta') {
    if (esperada !== null && recebida !== null) {
      return Math.max(0, esperada - recebida);
    }

    return esperada;
  }

  if (subtipo === 'sobra' || subtipo === 'produto_nao_previsto') {
    if (esperada !== null && recebida !== null) {
      return Math.max(0, recebida - esperada);
    }

    return recebida;
  }

  return null;
}

function aggregateRecebidoPorProduto(
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
      loteRecebido: item.loteRecebido ?? existing.loteRecebido,
      validade: item.validade ?? existing.validade,
    });
  }

  return map;
}

function resolveProduto(
  produtoId: string | null,
  produtos: Map<string, ProdutoRecord>,
): Pick<CreateCncItemInput, 'produtoId' | 'sku' | 'descricaoProduto'> {
  if (!produtoId) {
    return {
      produtoId: null,
      sku: null,
      descricaoProduto: null,
    };
  }

  const produto = produtos.get(produtoId);

  return {
    produtoId,
    sku: produto?.sku ?? null,
    descricaoProduto: produto?.descricao ?? null,
  };
}

export type MontarItensCncRecebimentoInput = {
  divergencias: DivergenciaRecebimentoRecord[];
  avarias: RecebimentoAvariaRecord[];
  itensEsperados: ItemPreRecebimentoRecord[];
  itensRecebidos: ItemRecebimentoRecord[];
  produtos: Map<string, ProdutoRecord>;
};

export function montarItensCncRecebimento(
  input: MontarItensCncRecebimentoInput,
): CreateCncItemInput[] {
  const esperadosPorProduto = new Map(
    input.itensEsperados.map((item) => [item.produtoId, item]),
  );
  const recebidosPorProduto = aggregateRecebidoPorProduto(input.itensRecebidos);
  const itens: CreateCncItemInput[] = [];

  for (const divergencia of input.divergencias) {
    const subtipo = mapTipoDivergenciaToSubtipo(divergencia.tipoDivergencia);

    if (SUBTIPOS_EXCLUIDOS_CNC.has(subtipo)) {
      continue;
    }

    const esperado = divergencia.produtoId
      ? esperadosPorProduto.get(divergencia.produtoId)
      : undefined;
    const recebido = divergencia.produtoId
      ? recebidosPorProduto.get(divergencia.produtoId)
      : undefined;

    const quantidadeEsperada =
      divergencia.quantidadeEsperada ?? esperado?.quantidadeEsperada ?? null;
    const quantidadeRecebida =
      divergencia.quantidadeRecebida ?? recebido?.quantidadeRecebida ?? null;

    itens.push({
      tipo: 'divergencia',
      referenciaId: divergencia.id,
      subtipoOcorrencia: subtipo,
      ...resolveProduto(divergencia.produtoId, input.produtos),
      quantidadeEsperada,
      quantidadeRecebida,
      quantidadeDivergente: calcularQuantidadeDivergente(
        subtipo,
        quantidadeEsperada,
        quantidadeRecebida,
      ),
      unidadeMedida: recebido?.unidadeMedida ?? esperado?.unidadeMedida ?? null,
      loteEsperado: esperado?.loteEsperado ?? null,
      loteRecebido: recebido?.loteRecebido ?? null,
      validadeEsperada: esperado?.validadeEsperada ?? null,
      validadeRecebida: recebido?.validade ?? null,
      pesoEsperado: esperado?.pesoEsperado ?? null,
      pesoRecebido: recebido?.pesoRecebido ?? null,
      descricaoDetalhe: divergencia.descricao,
      responsavelSugerido: inferResponsavelDivergencia(),
    });
  }

  for (const avaria of input.avarias) {
    const recebido = avaria.produtoId
      ? recebidosPorProduto.get(avaria.produtoId)
      : undefined;
    const esperado = avaria.produtoId
      ? esperadosPorProduto.get(avaria.produtoId)
      : undefined;

    itens.push({
      tipo: 'avaria',
      referenciaId: avaria.id,
      subtipoOcorrencia: 'avaria',
      ...resolveProduto(avaria.produtoId, input.produtos),
      quantidadeCaixas: avaria.quantidadeCaixas,
      quantidadeUnidades: avaria.quantidadeUnidades,
      quantidadeDivergente:
        avaria.quantidadeUnidades > 0
          ? avaria.quantidadeUnidades
          : avaria.quantidadeCaixas,
      unidadeMedida: recebido?.unidadeMedida ?? esperado?.unidadeMedida ?? null,
      loteEsperado: esperado?.loteEsperado ?? null,
      loteRecebido: recebido?.loteRecebido ?? null,
      validadeEsperada: esperado?.validadeEsperada ?? null,
      validadeRecebida: recebido?.validade ?? null,
      naturezaAvaria: avaria.natureza,
      causaAvaria: avaria.causa,
      tipoAvaria: avaria.tipo,
      descricaoDetalhe: `${avaria.tipo} · ${avaria.natureza} · ${avaria.causa}`,
      responsavelSugerido: inferFromAvariaNatureza(avaria.natureza),
    });
  }

  return itens;
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
