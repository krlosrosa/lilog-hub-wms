import type {
  GroupingRules,
  Transport,
} from '@/features/expedicao-config-mapa/types/config-mapa.schema';

const BASE_TRANSPORTES: Omit<Transport, 'id'>[] = [
  { placa: 'ABC-1234', tonelagem: 12.4, transportadora: 'TransLog' },
  { placa: 'XYZ-9876', tonelagem: 8.2, transportadora: 'RapidFrete' },
  { placa: 'DEF-5678', tonelagem: 15.1, transportadora: 'CargoMax' },
  { placa: 'GHI-4321', tonelagem: 4.5, transportadora: 'Expresso Sul' },
  { placa: 'JKL-0001', tonelagem: 10.0, transportadora: 'TransLog' },
  { placa: 'MNO-2233', tonelagem: 6.8, transportadora: 'RapidFrete' },
  { placa: 'PQR-7788', tonelagem: 9.3, transportadora: 'CargoMax' },
  { placa: 'STU-4455', tonelagem: 11.7, transportadora: 'Expresso Sul' },
];

export const MOCK_TRANSPORTES: Transport[] = Array.from({ length: 64 }, (_, index) => {
  const base = BASE_TRANSPORTES[index % BASE_TRANSPORTES.length]!;
  return {
    id: `transport-${index + 1}`,
    placa:
      index < BASE_TRANSPORTES.length
        ? base.placa
        : `${base.placa.slice(0, 3)}-${String(1000 + index).slice(-4)}`,
    tonelagem: base.tonelagem,
    transportadora: base.transportadora,
  };
});

export const MOCK_CLIENTES_SUGESTOES = [
  'CLIENTE_092',
  'DIST_OESTE',
  'ATACADO_NORTE',
  'VAREJO_SUL',
  'SUPERMERCADO_CENTRO',
  'DISTRIBUIDORA_LESTE',
  'CLIENTE_118',
  'ATACADO_PREMIUM',
];

export const MOCK_TRANSPORTES_SUGESTOES = [
  'ABC-1234',
  'XYZ-9876',
  'DEF-5678',
  'GHI-4321',
  'JKL-0001',
  'MNO-2233',
];

export const MOCK_REMESSAS_SUGESTOES = [
  'REM-10482',
  'REM-10483',
  'REM-20401',
  'REM-30512',
  'REM-44100',
  'REM-55201',
];

export const DEFAULT_GROUPING_RULES: GroupingRules = {
  segregate: {
    enabled: false,
    collapsed: false,
    items: [],
  },
  byClient: {
    enabled: true,
    collapsed: false,
    groups: [
      {
        id: 'group-client-1',
        name: 'Grupo Varejo Sul',
        items: ['CLIENTE_092', 'DIST_OESTE'],
        collapsed: false,
      },
    ],
  },
  byTransport: {
    enabled: false,
    collapsed: true,
    groups: [],
  },
  byShipment: {
    enabled: false,
    collapsed: true,
    groups: [],
  },
};
