import type {
  ChecklistItem,
  ChecklistStatusItem,
  Divergencia,
  PassagemBastao,
} from '../types/passagem-bastao.schema';

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'item-1',
    area: 'docas',
    title: 'Piso desobstruído e limpo',
    description: 'Sem pallets quebrados ou resíduos de filme stretch.',
    icon: 'pallet',
  },
  {
    id: 'item-2',
    area: 'corredores',
    title: 'Sinalização de solo visível',
    description: 'Faixas amarelas limpas e sem marcas de pneus.',
    icon: 'view_column',
  },
  {
    id: 'item-3',
    area: 'picking',
    title: 'Caixas e SKUs alinhados',
    description: 'Frentes de picking sem caixas abertas.',
    icon: 'shopping_basket',
  },
  {
    id: 'item-4',
    area: 'refeitorio',
    title: 'Higienização de bancadas',
    description: 'Mesas sem resíduos após o turno.',
    icon: 'restaurant',
  },
  {
    id: 'item-5',
    area: 'docas',
    title: 'Niveladoras operacionais',
    description: 'Limpeza dos trilhos e fosso das niveladoras.',
    icon: 'door_open',
  },
  {
    id: 'item-6',
    area: 'corredores',
    title: 'Lixeiras de coleta seletiva',
    description: 'Esvaziadas e com novos sacos instalados.',
    icon: 'delete',
  },
];

export const AREA_FILTER_LABELS: Record<
  'all' | 'docas' | 'corredores' | 'picking' | 'refeitorio',
  string
> = {
  all: 'Todas',
  docas: 'Docas',
  corredores: 'Corredores',
  picking: 'Picking',
  refeitorio: 'Refeitório',
};

export const MOCK_DIVERGENCIAS: Divergencia[] = [
  {
    id: 'div-1',
    sku: 'BAT-4592-X',
    nome: 'Bateria Industrial Lítio 12V',
    tipo: 'quantidade',
    valor: '-2 un.',
    localizacao: 'Corredor B4',
  },
  {
    id: 'div-2',
    sku: 'CAB-0012',
    nome: 'Cabo Blindado 50m',
    tipo: 'dano',
    valor: 'Danos',
    localizacao: 'Recebimento',
  },
];

export const MOCK_STATUS_ITENS: ChecklistStatusItem[] = [
  { id: 'maquinario', label: 'Maquinário', concluido: true },
  { id: 'epis', label: 'EPIs', concluido: true },
];

export const MOCK_PASSAGEM_BASTAO: PassagemBastao = {
  protocolo: '#SHF-2023-11-09-A1',
  operadorReceptor: 'Marcos Silva',
  divergencias: MOCK_DIVERGENCIAS,
  progressoChecklist: 85,
  statusItens: MOCK_STATUS_ITENS,
  evidencias: [
    {
      id: 'ev-1',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=400&fit=crop',
      alt: 'Estoque organizado em prateleiras industriais',
    },
    {
      id: 'ev-2',
      url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=400&fit=crop',
      alt: 'Empilhadeira elétrica em zona de carregamento',
    },
  ],
};
