import type { LucideIcon } from 'lucide-react';
import {
  Boxes,
  Footprints,
  LogOut,
  Package,
  Truck,
} from 'lucide-react';

import type { ElementType } from '@/features/armazem-layout/types';

export const CELL_SIZE_PX = 48;
export const GRID_MARGIN_PX = 32;
export const DEFAULT_GRID_COLS = 28;
export const DEFAULT_GRID_ROWS = 18;
export const DEFAULT_LAYOUT_NAME = 'Armazém Principal';
export const MIN_ZOOM = 50;
export const MAX_ZOOM = 200;
export const ZOOM_STEP = 10;

export type ElementMeta = {
  label: string;
  icon: LucideIcon;
  defaultGw: number;
  defaultGh: number;
  defaultLevels?: number;
  labelPrefix: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconClass: string;
};

export const ELEMENT_META: Record<ElementType, ElementMeta> = {
  estante: {
    label: 'Estante',
    icon: Package,
    defaultGw: 1,
    defaultGh: 1,
    defaultLevels: 3,
    labelPrefix: 'EST',
    bgClass: 'bg-primary/20',
    borderClass: 'border-primary/50',
    textClass: 'text-primary',
    iconClass: 'text-primary',
  },
  corredor: {
    label: 'Corredor',
    icon: Footprints,
    defaultGw: 4,
    defaultGh: 1,
    labelPrefix: 'COR',
    bgClass: 'bg-muted/40',
    borderClass: 'border-outline-variant',
    textClass: 'text-muted-foreground',
    iconClass: 'text-muted-foreground',
  },
  doca: {
    label: 'Doca',
    icon: Truck,
    defaultGw: 2,
    defaultGh: 1,
    labelPrefix: 'DOCA',
    bgClass: 'bg-secondary/20',
    borderClass: 'border-secondary/50',
    textClass: 'text-secondary',
    iconClass: 'text-secondary',
  },
  staging: {
    label: 'Staging',
    icon: Boxes,
    defaultGw: 6,
    defaultGh: 1,
    labelPrefix: 'STG',
    bgClass: 'bg-tertiary/15',
    borderClass: 'border-tertiary/40',
    textClass: 'text-tertiary',
    iconClass: 'text-tertiary',
  },
  saida: {
    label: 'Saída',
    icon: LogOut,
    defaultGw: 3,
    defaultGh: 1,
    labelPrefix: 'EXP',
    bgClass: 'bg-destructive/15',
    borderClass: 'border-destructive/40',
    textClass: 'text-destructive',
    iconClass: 'text-destructive',
  },
};

export const glassPanelClassName =
  'glass-panel rounded-xl border border-outline-variant shadow-inner-glow backdrop-blur-glass';

export const fieldLabelClassName =
  'block text-xs font-medium uppercase tracking-wider text-muted-foreground';
