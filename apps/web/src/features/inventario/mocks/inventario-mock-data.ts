import type { ResponsavelGestorOption } from '@/features/inventario/types/inventario-cadastro.schema';
import type {
  DemandaContagemItem,
  InventarioKpi,
  InventarioListaItem,
  TrendMes,
} from '@/features/inventario/types/inventario-lista.schema';

export const MOCK_RESPONSAVEIS_GESTORES: ResponsavelGestorOption[] = [
  { value: '1', label: 'Carlos Eduardo (Gerente Regional)' },
  { value: '2', label: 'Ana Paula (Coord. Logística)' },
  { value: '3', label: 'Marcos Silva (Ops Supervisor)' },
];

export const MOCK_RESPONSAVEIS_CONTAGEM: ResponsavelGestorOption[] = [
  { value: '1', label: 'Ricardo Silva (Operações)' },
  { value: '2', label: 'Ana Martins (Supervisor)' },
  { value: '3', label: 'Julio Cesar (Estoque)' },
];

export const MOCK_INVENTARIO_KPI: InventarioKpi = {
  acuraciaGlobal: 98.4,
  acuraciaDeltaPercent: 1.2,
  itensInventariados: 14200,
  itensMeta: 15000,
  divergenciasTotal: 12,
  divergenciasDelta: 4,
  statusAtualLabel: 'Em progresso',
  tempoEstimadoLabel: 'Conclusão estimada em 4h',
};

export const MOCK_TREND_MENSAL: TrendMes[] = [
  { mes: 'Jun', valorPercent: 97.2 },
  { mes: 'Jul', valorPercent: 97.5 },
  { mes: 'Ago', valorPercent: 97.8 },
  { mes: 'Set', valorPercent: 98.1 },
  { mes: 'Out', valorPercent: 98.4 },
];

export const MOCK_INVENTARIOS: InventarioListaItem[] = [
  {
    id: 'inv-084',
    codigo: 'INV-2023-084',
    dataLabel: '24 Out 2023',
    responsavelNome: 'Marcos Castro',
    responsavelIniciais: 'MC',
    tipo: 'ciclo',
    acuraciaPercent: 99.8,
    status: 'concluido',
  },
  {
    id: 'inv-085',
    codigo: 'INV-2023-085',
    dataLabel: 'Hoje, 09:15',
    responsavelNome: 'Ana Luiza',
    responsavelIniciais: 'AL',
    tipo: 'geral',
    acuraciaPercent: null,
    status: 'em-progresso',
    destaque: true,
  },
  {
    id: 'inv-083',
    codigo: 'INV-2023-083',
    dataLabel: '22 Out 2023',
    responsavelNome: 'Ricardo P.',
    responsavelIniciais: 'RP',
    tipo: 'ciclo',
    acuraciaPercent: 94.1,
    status: 'concluido',
  },
  {
    id: 'inv-086',
    codigo: 'INV-2023-086',
    dataLabel: '28 Out 2023',
    responsavelNome: 'Sérgio M.',
    responsavelIniciais: 'SM',
    tipo: 'geral',
    acuraciaPercent: null,
    status: 'agendado',
  },
];

export const MOCK_SETORES = [
  'CORREDOR A',
  'CÂMARA FRIA 02',
  'CORREDOR B',
  'ÁREA DE EXPEDIÇÃO',
  'DOCA 03',
] as const;

export const MOCK_CATEGORIAS = [
  'ELETRÔNICOS',
  'ALIMENTOS',
  'BEBIDAS',
  'HIGIENE',
  'LIMPEZA',
] as const;

/** Demandas iniciais para a tela de gestão (passo 2) */
export const MOCK_DEMANDAS_CONTAGEM: DemandaContagemItem[] = [
  {
    id: 'd1',
    localTitulo: 'Corredor A - Alimentos',
    localSubtitulo: 'Prateleiras 01 a 20',
    responsavelNome: 'Ricardo Silva',
    tipo: 'cega',
    status: 'aguardando-inicio',
    iconName: 'grid',
  },
  {
    id: 'd2',
    localTitulo: 'Câmara Fria 02',
    localSubtitulo: 'Setor de Congelados',
    responsavelNome: 'Ana Martins',
    tipo: 'validacao',
    status: 'aguardando-inicio',
    iconName: 'snow',
  },
];

let demandasMockStore: DemandaContagemItem[] = [...MOCK_DEMANDAS_CONTAGEM];

export function getDemandasMockStore(): DemandaContagemItem[] {
  return demandasMockStore;
}

export function addDemandaToMockStore(item: DemandaContagemItem): void {
  demandasMockStore = [item, ...demandasMockStore];
}

export function removeDemandaFromMockStore(id: string): void {
  demandasMockStore = demandasMockStore.filter((d) => d.id !== id);
}
