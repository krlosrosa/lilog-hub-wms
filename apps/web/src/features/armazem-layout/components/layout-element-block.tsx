'use client';

import { cn } from '@lilog/ui';

import { ELEMENT_META } from '@/features/armazem-layout/constants';
import type { ArmazemLayoutSlotOcupacaoApi } from '@/features/armazem-layout/api';
import type { LayoutElement } from '@/features/armazem-layout/types';
import {
  getElementOcupacaoStyle,
  getElementOcupacaoSummary,
} from '@/features/armazem-layout/utils/ocupacao-styles';

type LayoutElementBlockProps = {
  element: LayoutElement;
  selected: boolean;
  viewMode: 'editar' | 'ocupacao';
  ocupacaoSlots?: ArmazemLayoutSlotOcupacaoApi[];
  style: { left: number; top: number; width: number; height: number };
  onSelect: () => void;
  onMouseDown: (event: React.MouseEvent) => void;
};

export function LayoutElementBlock({
  element,
  selected,
  viewMode,
  ocupacaoSlots = [],
  style,
  onSelect,
  onMouseDown,
}: LayoutElementBlockProps) {
  const meta = ELEMENT_META[element.type];
  const Icon = meta.icon;
  const ocupacaoStyle =
    viewMode === 'ocupacao'
      ? getElementOcupacaoStyle(element.id, ocupacaoSlots)
      : null;
  const ocupacaoSummary =
    viewMode === 'ocupacao'
      ? getElementOcupacaoSummary(element.id, ocupacaoSlots)
      : null;

  return (
    <button
      type="button"
      data-layout-element
      onMouseDown={onMouseDown}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={cn(
        'absolute flex flex-col overflow-hidden rounded-md border-2 text-left transition-shadow',
        ocupacaoStyle?.bgClass ?? meta.bgClass,
        ocupacaoStyle?.borderClass ?? meta.borderClass,
        selected ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : '',
      )}
      style={style}
    >
      <div className="flex items-center gap-1 border-b border-outline-variant/30 px-1.5 py-1">
        <Icon
          className={cn(
            'h-3 w-3 shrink-0',
            ocupacaoStyle?.textClass ?? meta.iconClass,
          )}
        />
        <span
          className={cn(
            'truncate font-mono text-[9px] font-bold',
            ocupacaoStyle?.textClass ?? meta.textClass,
          )}
        >
          {element.label}
        </span>
      </div>

      {viewMode === 'ocupacao' && ocupacaoSummary ? (
        <div className="flex flex-1 items-center justify-center px-1 py-2">
          <span className="text-center font-mono text-[8px] leading-tight text-muted-foreground">
            {ocupacaoSummary}
          </span>
        </div>
      ) : element.type === 'estante' && element.levels ? (
        <div className="flex flex-1 flex-col gap-px p-1">
          {Array.from({ length: element.levels }).map((_, index) => (
            <div
              key={index}
              className="h-1.5 flex-1 rounded-sm bg-primary/30"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-1">
          <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
            {meta.label}
          </span>
        </div>
      )}
    </button>
  );
}
