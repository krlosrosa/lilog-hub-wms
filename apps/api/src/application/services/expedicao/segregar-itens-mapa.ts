import type { GerarMapasConfigInput } from '../../dtos/expedicao/gerar-mapas.dto.js';
import {
  calcularBreakdownQuantidade,
  type BreakdownQuantidade,
} from './calcular-breakdown-quantidade.js';
import type { EnderecoItemMapaCampos } from './endereco-item-mapa.js';

export type ItemMapaSegregavel = {
  sku: string;
  descricao: string | null;
  remessa: string;
  cliente: string;
  codCliente: string;
  empresa: string;
  categoria: string;
  lote: string | null;
  dataFabricacao: string | null;
  faixa: string | null;
  quantidade: number;
  unidadeMedida: string;
  quantidadeNormalizadaUnidades: number;
  peso: number | null;
  unidadesPorCaixa: number | null;
  caixasPorPalete: number | null;
  pesoBrutoUnidade: string | null;
  pesoBrutoCaixa: string | null;
  pesoBrutoPalete: string | null;
  pesoLiquidoUnidade: string | null;
  pesoLiquidoCaixa: string | null;
  pesoLiquidoPalete: string | null;
  quebraPalete?: boolean;
} & EnderecoItemMapaCampos;

export type GrupoItensSegregado = {
  idSuffix: string;
  sufixoTitulo: string;
  itens: ItemMapaSegregavel[];
};

type ConfigSegregacao = Pick<
  GerarMapasConfigInput,
  'segregarPaleteFull' | 'segregarUnidade'
>;

function calcularBreakdownItem(item: ItemMapaSegregavel): BreakdownQuantidade | null {
  return calcularBreakdownQuantidade(
    item.quantidadeNormalizadaUnidades,
    item.unidadesPorCaixa,
    item.caixasPorPalete,
    item.pesoBrutoUnidade,
    item.pesoBrutoCaixa,
    item.pesoBrutoPalete,
    item.pesoLiquidoUnidade,
    item.pesoLiquidoCaixa,
    item.pesoLiquidoPalete,
  );
}

function somarPesosBreakdown(
  breakdown: BreakdownQuantidade,
  tiers: Array<'paletes' | 'caixas' | 'unidades'>,
): number | null {
  const valores: number[] = [];

  if (tiers.includes('paletes') && breakdown.pesoPaletes != null) {
    valores.push(breakdown.pesoPaletes);
  }
  if (tiers.includes('caixas') && breakdown.pesoCaixas != null) {
    valores.push(breakdown.pesoCaixas);
  }
  if (tiers.includes('unidades') && breakdown.pesoUnidades != null) {
    valores.push(breakdown.pesoUnidades);
  }

  if (valores.length === 0) {
    return null;
  }

  return valores.reduce((total, valor) => total + valor, 0);
}

function escalarQuantidade(
  quantidade: number,
  qtdOriginal: number,
  qtdNova: number,
): number {
  if (qtdOriginal <= 0) {
    return quantidade;
  }

  return Math.round((quantidade * qtdNova) / qtdOriginal);
}

function criarItemParcial(
  item: ItemMapaSegregavel,
  qtdNorm: number,
  peso: number | null,
): ItemMapaSegregavel {
  return {
    ...item,
    quantidade: escalarQuantidade(
      item.quantidade,
      item.quantidadeNormalizadaUnidades,
      qtdNorm,
    ),
    quantidadeNormalizadaUnidades: qtdNorm,
    peso,
  };
}

function splitItemPaletes(
  item: ItemMapaSegregavel,
): { paletes: ItemMapaSegregavel | null; resto: ItemMapaSegregavel | null } {
  const breakdown = calcularBreakdownItem(item);

  if (
    !breakdown ||
    breakdown.paletes <= 0 ||
    !item.unidadesPorCaixa ||
    !item.caixasPorPalete
  ) {
    return { paletes: null, resto: item };
  }

  const qtdPaletes =
    breakdown.paletes * item.caixasPorPalete * item.unidadesPorCaixa;
  const qtdResto = item.quantidadeNormalizadaUnidades - qtdPaletes;

  if (qtdPaletes <= 0) {
    return { paletes: null, resto: item };
  }

  const pesoPaletes = somarPesosBreakdown(breakdown, ['paletes']);
  const paletes = criarItemParcial(item, qtdPaletes, pesoPaletes);

  if (qtdResto <= 0) {
    return { paletes, resto: null };
  }

  const pesoResto = somarPesosBreakdown(breakdown, ['caixas', 'unidades']);
  const resto = criarItemParcial(item, qtdResto, pesoResto);

  return { paletes, resto };
}

function splitItemUnidades(
  item: ItemMapaSegregavel,
): { unidades: ItemMapaSegregavel | null; resto: ItemMapaSegregavel | null } {
  const breakdown = calcularBreakdownItem(item);

  if (!breakdown || breakdown.unidades <= 0) {
    return { unidades: null, resto: item };
  }

  const qtdUnidades = breakdown.unidades;
  const qtdResto = item.quantidadeNormalizadaUnidades - qtdUnidades;

  const pesoUnidades = somarPesosBreakdown(breakdown, ['unidades']);
  const unidades = criarItemParcial(item, qtdUnidades, pesoUnidades);

  if (qtdResto <= 0) {
    return { unidades, resto: null };
  }

  const pesoResto = somarPesosBreakdown(breakdown, ['paletes', 'caixas']);
  const resto = criarItemParcial(item, qtdResto, pesoResto);

  return { unidades, resto };
}

export function segregarItensConsolidados(
  itens: ItemMapaSegregavel[],
  config: ConfigSegregacao,
): GrupoItensSegregado[] {
  const segregarPaleteFull = config.segregarPaleteFull ?? false;
  const segregarUnidade = config.segregarUnidade ?? false;

  if (!segregarPaleteFull && !segregarUnidade) {
    return [{ idSuffix: '', sufixoTitulo: '', itens }];
  }

  const itensPaletes: ItemMapaSegregavel[] = [];
  const itensUnidades: ItemMapaSegregavel[] = [];
  const itensResto: ItemMapaSegregavel[] = [];

  itens.forEach((item) => {
    let restoAtual: ItemMapaSegregavel | null = item;

    if (segregarPaleteFull && restoAtual) {
      const { paletes, resto } = splitItemPaletes(restoAtual);
      if (paletes) {
        itensPaletes.push(paletes);
      }
      restoAtual = resto;
    }

    if (segregarUnidade && restoAtual) {
      const { unidades, resto } = splitItemUnidades(restoAtual);
      if (unidades) {
        itensUnidades.push(unidades);
      }
      restoAtual = resto;
    }

    if (restoAtual) {
      itensResto.push(restoAtual);
    }
  });

  const grupos: GrupoItensSegregado[] = [];

  if (itensPaletes.length > 0) {
    grupos.push({
      idSuffix: '-paletes-completos',
      sufixoTitulo: ' — Paletes Completos',
      itens: itensPaletes,
    });
  }

  if (itensUnidades.length > 0) {
    grupos.push({
      idSuffix: '-unidades',
      sufixoTitulo: ' — Unidades',
      itens: itensUnidades,
    });
  }

  if (itensResto.length > 0) {
    grupos.push({
      idSuffix: '',
      sufixoTitulo: '',
      itens: itensResto,
    });
  }

  return grupos.length > 0 ? grupos : [{ idSuffix: '', sufixoTitulo: '', itens: [] }];
}
