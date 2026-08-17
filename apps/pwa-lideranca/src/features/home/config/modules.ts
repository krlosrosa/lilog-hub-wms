import {
  ClipboardCheck,
  PackageSearch,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

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
];
