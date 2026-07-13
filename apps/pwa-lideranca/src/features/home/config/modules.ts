import {
  ClipboardCheck,
  LogOut,
  PackageSearch,
  ShieldCheck,
  Truck,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

import { FUTURE_AREA_MODULES } from './operational-areas';

export type ModuleStatus = 'available' | 'coming_soon';

export type LeadershipModuleSection = 'turno' | 'operacional' | 'futuro';

export interface LeadershipModule {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: ModuleStatus;
  to?: string;
  section: LeadershipModuleSection;
  iconTone: 'secondary' | 'primary' | 'warning' | 'tertiary';
}

export const LEADERSHIP_MODULES: LeadershipModule[] = [
  {
    id: 'sessao-presenca',
    title: 'Presença da Equipe',
    description: 'Abrir turno e marcar presenças da equipe',
    icon: UserCheck,
    status: 'available',
    to: '/sessao-presenca',
    section: 'turno',
    iconTone: 'primary',
  },
  {
    id: 'expedicao',
    title: 'Expedição',
    description: 'Torre de controle e gestão de recursos do turno',
    icon: Truck,
    status: 'available',
    to: '/expedicao',
    section: 'operacional',
    iconTone: 'secondary',
  },
  {
    id: 'devolucao',
    title: 'Devolução',
    description: 'Alocações, conferentes e pausas da equipe',
    icon: LogOut,
    status: 'available',
    to: '/devolucao/gestao-recursos',
    section: 'operacional',
    iconTone: 'warning',
  },
  {
    id: 'recebimento',
    title: 'Recebimento',
    description: 'Atribuição de conferentes e acompanhamento das docas',
    icon: PackageSearch,
    status: 'available',
    to: '/recebimento/gestao-recursos',
    section: 'operacional',
    iconTone: 'primary',
  },
  {
    id: 'passagem-bastao',
    title: 'Passagem de Bastão',
    description: 'Revisão e relatórios de turno',
    icon: ClipboardCheck,
    status: 'coming_soon',
    section: 'futuro',
    iconTone: 'primary',
  },
  {
    id: 'aprovacoes',
    title: 'Aprovações',
    description: 'Movimentações, CNC e exceções',
    icon: ShieldCheck,
    status: 'coming_soon',
    section: 'futuro',
    iconTone: 'secondary',
  },
  ...FUTURE_AREA_MODULES.map(
    (item): LeadershipModule => ({
      id: item.id,
      title: item.title,
      description: item.description,
      icon: item.icon,
      status: item.status,
      to: item.to,
      section: 'futuro',
      iconTone: item.iconTone === 'tertiary' ? 'secondary' : item.iconTone,
    }),
  ),
];
