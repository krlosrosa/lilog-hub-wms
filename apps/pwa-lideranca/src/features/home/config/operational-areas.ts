import {
  BarChart3,
  ClipboardCheck,
  Monitor,
  Package,
  PackageSearch,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type OperationalAreaStatus = 'available' | 'coming_soon';

export interface OperationalAreaItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: OperationalAreaStatus;
  to?: string;
  iconTone: 'secondary' | 'primary' | 'warning' | 'tertiary';
}

export const EXPEDICAO_AREA_MODULES: OperationalAreaItem[] = [
  {
    id: 'torre',
    title: 'Torre de Expedição',
    description: 'KPIs, transportes em risco e pipeline do turno',
    icon: BarChart3,
    status: 'available',
    to: '/expedicao/torre',
    iconTone: 'secondary',
  },
  {
    id: 'gestao-recursos',
    title: 'Gestão de Recursos',
    description: 'Equipe, demandas e pausas por processo',
    icon: Users,
    status: 'available',
    to: '/expedicao/gestao-recursos',
    iconTone: 'warning',
  },
];

export const EXPEDICAO_PROCESSO_MODULES: OperationalAreaItem[] = [
  {
    id: 'separacao',
    title: 'Separação',
    description: 'Monitore operadores e o progresso da separação',
    icon: Package,
    status: 'available',
    to: '/expedicao/gestao-recursos/separacao',
    iconTone: 'primary',
  },
  {
    id: 'conferencia',
    title: 'Conferência',
    description: 'Acompanhe conferentes e demandas em andamento',
    icon: ClipboardCheck,
    status: 'available',
    to: '/expedicao/gestao-recursos/conferencia',
    iconTone: 'tertiary',
  },
  {
    id: 'carregamento',
    title: 'Carregamento',
    description: 'Organize equipes por veículo e rota',
    icon: Truck,
    status: 'available',
    to: '/expedicao/gestao-recursos/carregamento',
    iconTone: 'warning',
  },
];

export const DEVOLUCAO_AREA_MODULES: OperationalAreaItem[] = [
  {
    id: 'gestao-recursos-devolucao',
    title: 'Gestão de Recursos',
    description: 'Alocações, conferentes e pausas da equipe',
    icon: Users,
    status: 'available',
    to: '/devolucao/gestao-recursos',
    iconTone: 'secondary',
  },
];

export const RECEBIMENTO_AREA_MODULES: OperationalAreaItem[] = [
  {
    id: 'gestao-recursos-recebimento',
    title: 'Gestão de Recursos',
    description: 'Atribuição de conferentes e acompanhamento das docas',
    icon: Users,
    status: 'available',
    to: '/recebimento/gestao-recursos',
    iconTone: 'primary',
  },
];

export const FUTURE_AREA_MODULES: OperationalAreaItem[] = [
  {
    id: 'op-wms',
    title: 'OP-WMS',
    description: 'Picking, ressuprimento e visões de estoque',
    icon: Monitor,
    status: 'coming_soon',
    iconTone: 'primary',
  },
];
