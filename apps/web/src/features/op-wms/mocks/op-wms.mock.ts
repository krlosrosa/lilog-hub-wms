import type {
  ActiveMission,
  PickingKpi,
  ProductivityKpis,
  QuickAction,
  ReplenishmentItem,
  ShiftStatus,
  StockOrigin,
  WmsAlert,
} from '@/features/op-wms/types/op-wms.schema';

export const MOCK_PRODUCTIVITY_KPIS: ProductivityKpis = {
  tasksCompleted: 142,
  tasksGoal: 200,
  tasksProgressPercent: 71,
  tasksDeltaPercent: 12,
  averageTimePerUnit: '0:42',
  qualityPercent: 99.8,
  qualityLevel: 'Nível Platinum',
};

export const MOCK_ACTIVE_MISSIONS: ActiveMission[] = [
  {
    id: 'mission-1',
    title: 'Picking Onda #4429',
    position: 'A-12-04-01',
    itemDescription: 'Item: Smartphone X-100 (x12 unidades)',
    status: 'active',
    elapsedSeconds: 252,
    estimatedSeconds: 360,
    icon: 'move_to_inbox',
  },
  {
    id: 'mission-2',
    title: 'Próxima: Ressuprimento Corredor G',
    position: '',
    itemDescription: '',
    status: 'locked',
    priority: 'alta',
    elapsedSeconds: 0,
    estimatedSeconds: 0,
    icon: 'keyboard_tab',
  },
];

export const MOCK_WMS_ALERTS: WmsAlert[] = [
  {
    id: 'alert-1',
    title: 'Bloqueio Corredor C',
    description:
      'Manutenção corretiva em andamento no trilho do transelevador 03.',
    severity: 'error',
    timeAgo: 'HÁ 5 MINUTOS',
  },
  {
    id: 'alert-2',
    title: 'Ruptura de Estoque SKU-990',
    description:
      'Nível crítico na zona de picking rápido. Priorizar ressuprimento.',
    severity: 'warning',
    timeAgo: 'HÁ 12 MINUTOS',
  },
  {
    id: 'alert-3',
    title: 'Nova Onda de Expedição',
    description: 'Lote #9932 (E-commerce) liberado para separação imediata.',
    severity: 'info',
    timeAgo: 'HÁ 22 MINUTOS',
  },
];

export const MOCK_SHIFT_STATUS: ShiftStatus = {
  duration: '05:22:18',
  weightMovedKg: 2450,
  latencyMs: 12,
  nodeId: 'DC-04-A',
};

export const MOCK_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'ressuprimento',
    label: 'Ressuprimento',
    shortcut: 'F1',
    href: '/op-wms/ressuprimento',
    icon: 'forklift',
    variant: 'default',
  },
  {
    id: 'consultar-sku',
    label: 'Consultar SKU',
    shortcut: 'F2',
    icon: 'inventory',
    variant: 'default',
  },
  {
    id: 'imprimir-etiqueta',
    label: 'Imprimir Etiqueta',
    shortcut: 'F4',
    icon: 'print',
    variant: 'default',
  },
  {
    id: 'sinalizar-alerta',
    label: 'Sinalizar Alerta',
    shortcut: 'F9',
    icon: 'emergency',
    variant: 'destructive',
  },
];

export const MOCK_STOCK_ORIGINS: StockOrigin[] = [
  {
    id: 'origin-1',
    address: 'EST-02-A',
    lotId: 'LT-2024-03-A',
    quantity: 12,
    quantityLabel: '12 UN',
    status: 'disponivel',
  },
  {
    id: 'origin-2',
    address: 'EST-05-C',
    lotId: 'LT-2024-03-A',
    quantity: 8,
    quantityLabel: '08 UN',
    status: 'disponivel',
  },
  {
    id: 'origin-3',
    address: 'EST-12-D',
    lotId: 'LT-2024-02-B',
    quantity: 24,
    quantityLabel: '24 UN',
    status: 'vencimento_proximo',
  },
];

export const MOCK_ESTIMATED_EXECUTION_MINUTES = 12;

export const MOCK_PICKING_KPIS: PickingKpi[] = [
  {
    id: 'kpi-critical',
    label: 'Ruptura Crítica',
    value: '24',
    variant: 'critical',
    badge: '+4 novos',
    subtext: 'vst. 10m ago',
    icon: 'error',
  },
  {
    id: 'kpi-below-security',
    label: 'Abaixo do Segurança',
    value: '142',
    variant: 'warning',
    badge: 'Atenção',
    subtext: 'Ação recomendada',
    icon: 'warning',
  },
  {
    id: 'kpi-missions',
    label: 'Missões em Curso',
    value: '58',
    variant: 'active',
    badge: '12 empilhadeiras',
    subtext: 'Efficiency 88%',
    icon: 'pending',
  },
  {
    id: 'kpi-capacity',
    label: 'Capacidade Disponível',
    value: '1.2k',
    variant: 'neutral',
    badge: '82% ocupado',
    subtext: 'Buffer OK',
    icon: 'inventory',
  },
];

export const MOCK_REPLENISHMENT_ITEMS: ReplenishmentItem[] = [
  {
    id: 'repl-1',
    address: 'PK-04-122-B',
    productName: 'Motor Elétrico Industrial 220v',
    sku: 'SKU-8829-X',
    balance: 0,
    min: 15,
    max: 50,
    occupancyPercent: 0,
    pending: 12,
    suggested: 50,
    status: 'critical',
    canGenerateMission: true,
  },
  {
    id: 'repl-2',
    address: 'PK-08-015-A',
    productName: 'Válvula Hidráulica Tipo-B',
    sku: 'SKU-1102-Y',
    balance: 8,
    min: 25,
    max: 100,
    occupancyPercent: 8,
    pending: 0,
    suggested: 92,
    status: 'warning',
    canGenerateMission: true,
  },
  {
    id: 'repl-3',
    address: 'PK-12-004-C',
    productName: 'Kit de Rolamentos Selados (4un)',
    sku: 'SKU-9900-R',
    balance: 45,
    min: 80,
    max: 300,
    occupancyPercent: 15,
    pending: 32,
    suggested: 255,
    status: 'warning',
    canGenerateMission: true,
  },
  {
    id: 'repl-4',
    address: 'PK-02-099-A',
    productName: 'Parafuso Autoatarrachante M8',
    sku: 'SKU-4412-K',
    balance: 820,
    min: 500,
    max: 2000,
    occupancyPercent: 41,
    pending: 150,
    suggested: 0,
    status: 'ok',
    canGenerateMission: false,
  },
  {
    id: 'repl-5',
    address: 'PK-09-211-B',
    productName: 'Fusível Térmico 15A',
    sku: 'SKU-3301-M',
    balance: 12,
    min: 40,
    max: 200,
    occupancyPercent: 6,
    pending: 5,
    suggested: 188,
    suggestedLabel: 'Enviado (188)',
    status: 'in_mission',
    missionId: '44291',
    canGenerateMission: false,
  },
];

export const MOCK_REPLENISHMENT_TOTAL = 1245;
