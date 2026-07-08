'use client';

import type { ComponentType } from 'react';
import { MousePointer2 } from 'lucide-react';

import { cn } from '@lilog/ui';

import {
  ELEMENT_META,
  glassPanelClassName,
} from '@/features/armazem-layout/constants';
import type { BuilderTool, ElementType } from '@/features/armazem-layout/types';

type LayoutToolbarProps = {
  activeTool: BuilderTool;
  zoomPercent: number;
  onSelectTool: (tool: BuilderTool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClearAll: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
};

const ELEMENT_TYPES = Object.keys(ELEMENT_META) as ElementType[];

export function LayoutToolbar({
  activeTool,
  zoomPercent,
  onSelectTool,
  onZoomIn,
  onZoomOut,
  onClearAll,
  onExport,
  onImport,
}: LayoutToolbarProps) {
  return (
    <div
      className={cn(
        glassPanelClassName,
        'mx-4 mt-4 flex shrink-0 flex-wrap items-center gap-2 px-3 py-2',
      )}
    >
      <ToolChip
        label="Selecionar"
        icon={MousePointer2}
        active={activeTool === 'selecionar'}
        onClick={() => onSelectTool('selecionar')}
      />

      <div className="mx-1 h-6 w-px bg-outline-variant" />

      {ELEMENT_TYPES.map((type) => {
        const meta = ELEMENT_META[type];
        const Icon = meta.icon;
        return (
          <ToolChip
            key={type}
            label={meta.label}
            icon={Icon}
            active={activeTool === type}
            onClick={() => onSelectTool(type)}
          />
        );
      })}

      <div className="mx-1 h-6 w-px bg-outline-variant" />

      <button
        type="button"
        onClick={onZoomOut}
        className="rounded-lg border border-outline-variant bg-surface-high px-2 py-1 text-xs hover:bg-surface-highest"
      >
        −
      </button>
      <span className="min-w-[3rem] text-center font-mono text-xs text-muted-foreground">
        {zoomPercent}%
      </span>
      <button
        type="button"
        onClick={onZoomIn}
        className="rounded-lg border border-outline-variant bg-surface-high px-2 py-1 text-xs hover:bg-surface-highest"
      >
        +
      </button>

      <div className="mx-1 h-6 w-px bg-outline-variant" />

      <button
        type="button"
        onClick={onExport}
        className="rounded-lg border border-outline-variant bg-surface-high px-3 py-1.5 text-xs hover:bg-surface-highest"
      >
        Exportar
      </button>

      <label className="cursor-pointer rounded-lg border border-outline-variant bg-surface-high px-3 py-1.5 text-xs hover:bg-surface-highest">
        Importar
        <input
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void onImport(file);
            }
            event.target.value = '';
          }}
        />
      </label>

      <button
        type="button"
        onClick={() => {
          if (window.confirm('Limpar todo o layout? Esta ação não pode ser desfeita.')) {
            onClearAll();
          }
        }}
        className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/20"
      >
        Limpar tudo
      </button>
    </div>
  );
}

function ToolChip({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
          : 'border-outline-variant bg-surface-high text-foreground hover:bg-surface-highest',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
