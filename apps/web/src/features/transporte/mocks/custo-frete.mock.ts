import {
  calcularCustoFreteSummary,
  calcularTotalPago,
  montarCustoFreteItem,
} from '@/features/transporte/lib/calcular-custo-frete';
import { MOCK_TRANSPORTES } from '@/features/transporte/mocks/transporte.mock';
import type {
  CustoFreteItem,
  CustoFreteRealizado,
  CustoFreteSummary,
} from '@/features/transporte/types/transporte.schema';

export const MOCK_CUSTOS_FRETE: CustoFreteRealizado[] = [
  {
    id: 'cf-001',
    transporteId: 'trans-002',
    custoDiariaPago: 720,
    custosAdicionais: [
      {
        id: 'ca-001',
        tipo: 'pedagio',
        descricao: 'Pedágio Castello Branco',
        valor: 85.5,
      },
      {
        id: 'ca-002',
        tipo: 'ajudante',
        descricao: 'Ajudante para descarga',
        valor: 120,
      },
    ],
    totalAdicionais: 205.5,
    totalPago: calcularTotalPago(720, [
      {
        id: 'ca-001',
        tipo: 'pedagio',
        descricao: 'Pedágio Castello Branco',
        valor: 85.5,
      },
      {
        id: 'ca-002',
        tipo: 'ajudante',
        descricao: 'Ajudante para descarga',
        valor: 120,
      },
    ]),
    status: 'pago',
    observacoes: 'Pagamento conforme nota fiscal da transportadora.',
    dataPagamento: '2026-06-04',
  },
  {
    id: 'cf-002',
    transporteId: 'trans-003',
    custoDiariaPago: 2300,
    custosAdicionais: [
      {
        id: 'ca-003',
        tipo: 'pernoite',
        descricao: 'Pernoite em posto fiscal',
        valor: 180,
      },
      {
        id: 'ca-004',
        tipo: 'paletizacao',
        descricao: 'Paletização extra na origem',
        valor: 350,
      },
      {
        id: 'ca-005',
        tipo: 'pedagio',
        descricao: 'Pedágios Anhanguera + Bandeirantes',
        valor: 142.8,
      },
      {
        id: 'ca-006',
        tipo: 'hora_extra',
        descricao: 'Espera na doca do cliente',
        valor: 280,
      },
    ],
    totalAdicionais: 952.8,
    totalPago: calcularTotalPago(2300, [
      {
        id: 'ca-003',
        tipo: 'pernoite',
        descricao: 'Pernoite em posto fiscal',
        valor: 180,
      },
      {
        id: 'ca-004',
        tipo: 'paletizacao',
        descricao: 'Paletização extra na origem',
        valor: 350,
      },
      {
        id: 'ca-005',
        tipo: 'pedagio',
        descricao: 'Pedágios Anhanguera + Bandeirantes',
        valor: 142.8,
      },
      {
        id: 'ca-006',
        tipo: 'hora_extra',
        descricao: 'Espera na doca do cliente',
        valor: 280,
      },
    ]),
    status: 'pago',
    observacoes: 'Valor acima do previsto — custos adicionais de pernoite e paletização.',
    dataPagamento: '2026-06-04',
  },
  {
    id: 'cf-003',
    transporteId: 'trans-001',
    custoDiariaPago: 0,
    custosAdicionais: [],
    totalAdicionais: 0,
    totalPago: 0,
    status: 'pendente',
  },
  {
    id: 'cf-004',
    transporteId: 'trans-004',
    custoDiariaPago: 580,
    custosAdicionais: [
      {
        id: 'ca-007',
        tipo: 'pedagio',
        descricao: 'Pedágio Marginal Tietê',
        valor: 45,
      },
    ],
    totalAdicionais: 45,
    totalPago: calcularTotalPago(580, [
      {
        id: 'ca-007',
        tipo: 'pedagio',
        descricao: 'Pedágio Marginal Tietê',
        valor: 45,
      },
    ]),
    status: 'contestado',
    observacoes: 'Valor de pedágio contestado — rota não passa por pedágio.',
    dataPagamento: '2026-06-03',
  },
  {
    id: 'cf-005',
    transporteId: 'trans-005',
    custoDiariaPago: 0,
    custosAdicionais: [],
    totalAdicionais: 0,
    totalPago: 0,
    status: 'pendente',
  },
];

function resolverTransporte(transporteId: string) {
  const transporte = MOCK_TRANSPORTES.find((item) => item.id === transporteId);

  if (!transporte) {
    throw new Error(`Transporte ${transporteId} não encontrado no mock.`);
  }

  return transporte;
}

export function montarCustoFreteItems(
  custos: CustoFreteRealizado[],
): CustoFreteItem[] {
  return custos.map((custoFrete) =>
    montarCustoFreteItem(custoFrete, resolverTransporte(custoFrete.transporteId)),
  );
}

export const MOCK_CUSTO_FRETE_ITEMS = montarCustoFreteItems(MOCK_CUSTOS_FRETE);

export const MOCK_CUSTO_FRETE_SUMMARY: CustoFreteSummary =
  calcularCustoFreteSummary(MOCK_CUSTO_FRETE_ITEMS);

export function buscarCustoFretePorId(id: string): CustoFreteItem | undefined {
  return MOCK_CUSTO_FRETE_ITEMS.find((item) => item.custoFrete.id === id);
}

export function buscarCustoFretePorTransporteId(
  transporteId: string,
): CustoFreteItem | undefined {
  return MOCK_CUSTO_FRETE_ITEMS.find(
    (item) => item.custoFrete.transporteId === transporteId,
  );
}
