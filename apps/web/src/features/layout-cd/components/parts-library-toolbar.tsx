'use client';

import type { ComponentType } from 'react';
import {
  Columns3,
  Download,
  Fence,
  Footprints,
  Forklift,
  Package,
  Rows3,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { MOCK_PARTS_LIBRARY } from '@/features/layout-cd/mocks/layout-cd.mock';
import type { PartsLibraryItem, RackType } from '@/features/layout-cd/types/layout-cd.schema';

const TYPE_ICONS: Record<RackType, ComponentType<{ className?: string }>> = {
  'porta-palete': Package,
  'drive-in': Columns3,
  'flow-rack': Rows3,
  'pedestrian-path': Footprints,
  'forklift-street': Forklift,
  'safety-barrier': Fence,
};

type PartsLibraryToolbarProps = {
  activePartType: RackType;
  contextHint: string;
  onSelectPart: (type: RackType) => void;
};

export function PartsLibraryToolbar({
  activePartType,
  contextHint,
  onSelectPart,
}: PartsLibraryToolbarProps) {
  return (
    <div className="shrink-0 border-b border-outline-variant bg-surface-low px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-foreground">Parts Library</p>
          <p className="font-mono text-[10px] text-muted-foreground">{contextHint}</p>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <button
            type="button"
            className="text-xs transition-colors hover:text-foreground"
          >
            Docs
          </button>
          <button
            type="button"
            className="flex items-center gap-1 text-xs transition-colors hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MOCK_PARTS_LIBRARY.map((item) => (
          <PartChip
            key={item.id}
            item={item}
            isActive={activePartType === item.type}
            onSelect={() => onSelectPart(item.type)}
          />
        ))}
      </div>
    </div>
  );
}

function PartChip({
  item,
  isActive,
  onSelect,
}: {
  item: PartsLibraryItem;
  isActive: boolean;
  onSelect: () => void;
}) {
  const Icon = TYPE_ICONS[item.type];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 transition-all',
        isActive
          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
          : item.highlighted
            ? 'border-primary/20 bg-secondary-container text-secondary-on-container hover:brightness-110'
            : 'border-outline-variant bg-surface-high hover:bg-surface-highest',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          isActive ? 'text-primary' : item.highlighted ? 'text-primary' : 'text-muted-foreground',
        )}
      />
      <span className="whitespace-nowrap text-xs font-medium">{item.name}</span>
    </button>
  );
}
