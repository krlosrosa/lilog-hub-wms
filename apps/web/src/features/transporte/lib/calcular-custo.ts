import type {
  CustoDetalhado,
  CustoPorTipo,
  NivelCusto,
  TipoVeiculo,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';

export const CUSTO_POR_TIPO: CustoPorTipo[] = [
  { tipo: 'VUC', custoDiaria: 420 },
  { tipo: 'Toco', custoDiaria: 580 },
  { tipo: 'Truck_3_4', custoDiaria: 720 },
  { tipo: 'Carreta', custoDiaria: 1150 },
  { tipo: 'Bitrem', custoDiaria: 1580 },
];

export function obterCustoDiaria(tipo: TipoVeiculo): number {
  return CUSTO_POR_TIPO.find((item) => item.tipo === tipo)?.custoDiaria ?? 720;
}

function calcularNivelCusto(total: number, referencia: number): NivelCusto {
  if (total <= referencia) {
    return 'dentro';
  }

  if (total <= referencia * 1.35) {
    return 'atencao';
  }

  return 'acima';
}

export function calcularCustoPrevisto(tipo: TipoVeiculo): CustoDetalhado {
  const custoDiaria = obterCustoDiaria(tipo);
  const referencia = obterCustoDiaria('Truck_3_4');
  const subtotal = Math.round(custoDiaria * 100) / 100;

  return {
    custoDiaria,
    subtotal,
    total: subtotal,
    nivel: calcularNivelCusto(subtotal, referencia),
  };
}

export function resolverCustoPrevisto(
  transporte: Pick<TransporteGrupo, 'freteSemCusto'>,
  tipoVeiculo: TipoVeiculo,
): number {
  if (transporte.freteSemCusto) {
    return 0;
  }

  return calcularCustoPrevisto(tipoVeiculo).total;
}

export function resolverTipoTarifaCusto(
  transporte: Pick<
    TransporteGrupo,
    'tipoTarifaCusto' | 'veiculoAlocado' | 'perfilEsperado'
  >,
): TipoVeiculo {
  return (
    transporte.tipoTarifaCusto ??
    transporte.veiculoAlocado?.tipo ??
    transporte.perfilEsperado
  );
}

export function resolverCustoPrevistoTransporte(
  transporte: Pick<
    TransporteGrupo,
    | 'freteSemCusto'
    | 'tipoTarifaCusto'
    | 'veiculoAlocado'
    | 'perfilEsperado'
  >,
): number {
  return resolverCustoPrevisto(
    transporte,
    resolverTipoTarifaCusto(transporte),
  );
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
