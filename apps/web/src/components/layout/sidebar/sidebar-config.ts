import {
  ArrowLeftRight,
  BarChart4,
  Building2,
  CalendarClock,
  ClipboardList,
  Coffee,
  FileText,
  FolderTree,
  HandHeart,
  Home,
  LineChart,
  MapPin,
  Monitor,
  Package,
  PackageCheck,
  PlayCircle,
  Plus,
  Receipt,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Truck,
  Users,
  UsersRound,
  Warehouse,
} from 'lucide-react';

import type { NavGroup } from './sidebar.types';

const baseSidebarConfig: NavGroup[] = [
  {
    id: 'painel',
    label: 'Painel',
    icon: LineChart,
    defaultOpen: true,
    items: [
      {
        id: 'inicio',
        label: 'Início',
        icon: Home,
        href: '/',
      },
    ],
  },
  {
    id: 'cadastros-estrutura',
    label: 'Cadastros e Estrutura',
    icon: FolderTree,
    items: [
      {
        id: 'cadastros-infraestrutura',
        label: 'Infraestrutura',
        icon: Building2,
        items: [
          {
            id: 'produtos',
            label: 'Produtos',
            icon: Package,
            href: '/produtos',
          },
          { id: 'docas', label: 'Docas', icon: Warehouse, href: '/docas' },
        ],
      },
      {
        id: 'cadastros-pessoas',
        label: 'Pessoas e Acessos',
        icon: Users,
        items: [
          {
            id: 'pessoas',
            label: 'Pessoas',
            icon: UsersRound,
            href: '/pessoas',
          },
          {
            id: 'pessoas-escalas',
            label: 'Escalas e Equipes',
            icon: Timer,
            href: '/pessoas/escalas',
          },
          {
            id: 'perfis-permissao',
            label: 'Perfis de Acesso',
            icon: ShieldCheck,
            href: '/usuarios/perfis',
          },
        ],
      },
      {
        id: 'cadastros-frota',
        label: 'Frota',
        icon: Truck,
        items: [
          {
            id: 'frota',
            label: 'Veículos',
            icon: Truck,
            href: '/frota',
          },
          {
            id: 'frota-agenda',
            label: 'Agenda e Alertas',
            icon: CalendarClock,
            href: '/frota/agenda',
          },
          {
            id: 'frota-cadastro',
            label: 'Cadastrar Veículo',
            icon: Plus,
            href: '/frota/novo',
          },
        ],
      },
    ],
  },
  {
    id: 'recebimento',
    label: 'Recebimento',
    icon: PackageCheck,
    items: [
      {
        id: 'recebimento-gestao',
        label: 'Recebimento',
        icon: PackageCheck,
        href: '/recebimento',
      },
      {
        id: 'recebimento-painel',
        label: 'Painel do Dia',
        icon: Monitor,
        href: '/recebimento/painel',
      },
    ],
  },
  {
    id: 'qualidade',
    label: 'Qualidade',
    icon: ShieldAlert,
    items: [
      {
        id: 'cnc',
        label: 'CNC',
        icon: ShieldAlert,
        href: '/cnc',
      },
    ],
  },
  {
    id: 'rotina-operacional',
    label: 'Rotina Operacional',
    icon: CalendarClock,
    items: [
      {
        id: 'sessao-operacao-sessoes',
        label: 'Sessões de Trabalho',
        icon: ClipboardList,
        href: '/sessao-operacao/sessoes',
      },
      {
        id: 'sessao-operacao-nova',
        label: 'Nova Sessão',
        icon: Plus,
        href: '/sessao-operacao/sessoes/nova',
      },
      {
        id: 'pausas',
        label: 'Pausas',
        icon: Timer,
        items: [
          {
            id: 'pausas-monitor',
            label: 'Monitor de Pausas',
            icon: Monitor,
            href: '/pausas',
          },
          {
            id: 'pausas-registro',
            label: 'Registrar Pausa',
            icon: PlayCircle,
            href: '/pausas/registro',
          },
          {
            id: 'pausas-relatorios',
            label: 'Relatórios',
            icon: BarChart4,
            href: '/pausas/relatorios',
          },
        ],
      },
      {
        id: 'passagem-bastao',
        label: 'Passagem de Turno',
        icon: ArrowLeftRight,
        items: [
          {
            id: 'passagem-bastao-relatorios',
            label: 'Relatórios',
            icon: BarChart4,
            href: '/passagem-bastao/relatorios',
          },
        ],
      },
    ],
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Settings2,
    items: [
      {
        id: 'config-operacional-hub',
        label: 'Parâmetros',
        icon: Settings2,
        href: '/config-operacional',
      },
      {
        id: 'regras-produtividade',
        label: 'Regras de Produtividade',
        icon: Timer,
        href: '/config-operacional/regras-produtividade',
      },
      {
        id: 'regras-pausas',
        label: 'Regras de Pausa',
        icon: Coffee,
        href: '/config-operacional/regras-pausas',
      },
    ],
  },
  {
    id: 'gestao',
    label: 'Gestão',
    icon: Receipt,
    items: [
      {
        id: 'unidades',
        label: 'Unidades',
        icon: Building2,
        href: '/unidades',
      },
      {
        id: 'centros-origem',
        label: 'Centros de Origem',
        icon: MapPin,
        href: '/centros-origem',
      },
    ],
  },
  {
    id: 'suporte',
    label: 'Suporte',
    icon: HandHeart,
    items: [
      {
        id: 'documentacao',
        label: 'Documentação',
        icon: FileText,
        href: '/documentacao',
      },
    ],
  },
];

export const sidebarConfig: NavGroup[] = baseSidebarConfig;
