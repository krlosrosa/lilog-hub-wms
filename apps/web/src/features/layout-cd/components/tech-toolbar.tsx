'use client';

import type { ReactNode } from 'react';
import { Hand, LampFloor, ZoomIn, ZoomOut } from 'lucide-react';

import { cn } from '@lilog/ui';

type TechToolbarProps = {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
};

const LEGEND = [
  { status: 'available' as const, label: 'Disponível', className: 'bg-status-active' },
  { status: 'partial' as const, label: 'Parcial', className: 'bg-tertiary' },
  { status: 'occupied' as const, label: 'Ocupado', className: 'bg-destructive' },
];

export function TechToolbar({ onZoomIn, onZoomOut }: TechToolbarProps) {
  return (
    <div className="z-10 flex shrink-0 items-center justify-between border-b border-outline-variant bg-surface-high px-8 py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 border border-outline-variant bg-surface-low px-3 py-1.5">
          <LampFloor className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-foreground">
            MAPA TÉCNICO - CORREDORES 01-04 + DRIVE-IN
          </span>
        </div>
        <div className="flex gap-1">
          <ToolbarButton title="Zoom In" onClick={onZoomIn}>
            <ZoomIn className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton title="Zoom Out" onClick={onZoomOut}>
            <ZoomOut className="h-5 w-5" />
          </ToolbarButton>
          <ToolbarButton title="Pan">
            <Hand className="h-5 w-5" />
          </ToolbarButton>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {LEGEND.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded-sm', item.className)} />
            <span className="font-mono text-xs text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  title,
  onClick,
}: {
  children: ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="border border-outline-variant bg-surface-highest p-1.5 transition-colors hover:bg-primary-container hover:text-primary-foreground"
    >
      {children}
    </button>
  );
}
