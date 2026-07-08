import type { TipoDivergencia } from '../model/recebimento/recebimento.model.js';
import type { ProdutoRecord } from '../repositories/produto/produto.repository.js';
import type { ItemPreRecebimentoRecord } from '../repositories/recebimento/pre-recebimento.repository.js';
import type { RecebimentoAvariaRecord } from '../repositories/recebimento/recebimento-avaria.repository.js';
import type {
  DivergenciaRecebimentoRecord,
  ItemRecebimentoRecord,
  RecebimentoRecord,
} from '../repositories/recebimento/recebimento.repository.js';

export type SituacaoProduto =
  | 'integro'
  | 'avariado'
  | 'falta'
  | 'excesso'
  | 'divergencia';

const DIVERGENCIAS_FALTA: TipoDivergencia[] = [
  'produto_ausente',
  'quantidade_menor',
];

const DIVERGENCIAS_TECNICAS: TipoDivergencia[] = [
  'divergencia_lote',
  'divergencia_peso',
  'divergencia_validade',
  'produto_nao_esperado',
];

const PRIORIDADE_TIPO_DIVERGENCIA: TipoDivergencia[] = [
  'produto_ausente',
  'quantidade_menor',
  'quantidade_maior',
  'produto_nao_esperado',
  'divergencia_lote',
  'divergencia_peso',
  'divergencia_validade',
];

function diffInDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function calcPercentualValidadeRestante(
  validade: Date | null | undefined,
  shelfLife: number | null | undefined,
): number | null {
  if (!validade || !shelfLife || shelfLife <= 0) {
    return null;
  }

  const hoje = new Date();
  const diasRestantes = diffInDays(hoje, validade);
  return Math.max(0, Math.round((diasRestantes / shelfLife) * 100));
}

function divergenciasDoProduto(
  produtoId: string,
  divergencias: DivergenciaRecebimentoRecord[],
): DivergenciaRecebimentoRecord[] {
  return divergencias.filter((divergencia) => divergencia.produtoId === produtoId);
}

export function mapSituacaoProduto(
  produtoId: string,
  avarias: RecebimentoAvariaRecord[],
  divergencias: DivergenciaRecebimentoRecord[],
): SituacaoProduto {
  const hasAvaria = avarias.some((avaria) => avaria.produtoId === produtoId);
  if (hasAvaria) {
    return 'avariado';
  }

  const tipos = divergenciasDoProduto(produtoId, divergencias).map(
    (divergencia) => divergencia.tipoDivergencia,
  );

  if (tipos.some((tipo) => DIVERGENCIAS_FALTA.includes(tipo))) {
    return 'falta';
  }

  if (tipos.includes('quantidade_maior')) {
    return 'excesso';
  }

  if (tipos.some((tipo) => DIVERGENCIAS_TECNICAS.includes(tipo))) {
    return 'divergencia';
  }

  return 'integro';
}

export function derivarTipoDivergenciaPrincipal(
  produtoId: string,
  divergencias: DivergenciaRecebimentoRecord[],
): TipoDivergencia | null {
  const tipos = new Set(
    divergenciasDoProduto(produtoId, divergencias).map(
      (divergencia) => divergencia.tipoDivergencia,
    ),
  );

  for (const tipo of PRIORIDADE_TIPO_DIVERGENCIA) {
    if (tipos.has(tipo)) {
      return tipo;
    }
  }

  return null;
}

export function buildRecebimentoFacts(input: {
  produtoId: string;
  item?: ItemRecebimentoRecord;
  itemEsperado?: ItemPreRecebimentoRecord;
  produto: ProdutoRecord | null;
  avarias: RecebimentoAvariaRecord[];
  divergencias: DivergenciaRecebimentoRecord[];
  recebimento: RecebimentoRecord;
}): Record<string, unknown> {
  const {
    produtoId,
    item,
    itemEsperado,
    produto,
    avarias,
    divergencias,
    recebimento,
  } = input;

  const hoje = new Date();
  const validade = item?.validade ?? itemEsperado?.validadeEsperada ?? null;
  const diasValidade = validade ? diffInDays(hoje, validade) : null;
  const quantidadeRecebida = item?.quantidadeRecebida ?? 0;

  return {
    produto: {
      produtoId,
      categoria: produto?.categoria ?? null,
      subcategoria: produto?.grupo ?? null,
      grupo: produto?.grupo ?? null,
      fornecedor: produto?.empresa ?? null,
      pesoKg: produto?.pesoBrutoUnidade
        ? Number(produto.pesoBrutoUnidade)
        : null,
      volumeM3: null,
      diasProducao: null,
      diasValidade,
      shelfLife: produto?.shelfLife ?? null,
      percentualValidadeRestante: calcPercentualValidadeRestante(
        validade,
        produto?.shelfLife,
      ),
      situacao: mapSituacaoProduto(produtoId, avarias, divergencias),
      tipoDivergencia: derivarTipoDivergenciaPrincipal(produtoId, divergencias),
    },
    recebimento: {
      dataRecebimento: recebimento.dataInicio?.toISOString() ?? null,
      quantidadeEsperada: itemEsperado?.quantidadeEsperada ?? null,
      quantidadeRecebida,
    },
    estoque: {
      quantidade: quantidadeRecebida,
      nivelMinimo: null,
    },
    endereco: {
      tipo: null,
      zonaTemperatura: null,
    },
  };
}
