import {
  BarChart3,
  ClipboardCheck,
  Monitor,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type ModuleStatus = 'available' | 'coming_soon';

export interface LeadershipModule {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: ModuleStatus;
  to?: string;
  featured?: boolean;
  iconTone: 'secondary' | 'primary' | 'warning';
}

export const LEADERSHIP_MODULES: LeadershipModule[] = [
  {
    id: 'sessao-presenca',
    title: 'Presença da Equipe',
    description: 'Abrir turno e marcar presenças da equipe',
    icon: UserCheck,
    status: 'available',
    to: '/sessao-presenca',
    featured: true,
    iconTone: 'primary',
  },
  {
    id: 'indicadores',
    title: 'Indicadores',
    description: 'KPIs e visão geral do turno',
    icon: BarChart3,
    status: 'available',
    to: '/indicadores',
    featured: true,
    iconTone: 'secondary',
  },
  {
    id: 'gestao-recursos',
    title: 'Gestão de Recursos',
    description: 'Equipe, demandas e pausas ao vivo',
    icon: Users,
    status: 'available',
    to: '/op-wms/gestao-recursos',
    featured: true,
    iconTone: 'warning',
  },
  {
    id: 'passagem-bastao',
    title: 'Passagem de Bastão',
    description: 'Revisão e relatórios de turno',
    icon: ClipboardCheck,
    status: 'coming_soon',
    iconTone: 'primary',
  },
  {
    id: 'aprovacoes',
    title: 'Aprovações',
    description: 'Movimentações, CNC e exceções',
    icon: ShieldCheck,
    status: 'coming_soon',
    iconTone: 'secondary',
  },
  {
    id: 'op-wms',
    title: 'OP-WMS',
    description: 'Picking, ressuprimento e outras visões WMS',
    icon: Monitor,
    status: 'coming_soon',
    iconTone: 'primary',
  },
];
