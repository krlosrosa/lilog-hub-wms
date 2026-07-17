import { Users, type LucideIcon } from 'lucide-react';

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

export const FUTURE_AREA_MODULES: OperationalAreaItem[] = [];
