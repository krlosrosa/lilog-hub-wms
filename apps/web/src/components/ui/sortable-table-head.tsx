'use client';

import { cn } from '@lilog/ui';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import { compactTableHeadCellClassName } from '@/components/ui/compact-table-classes';

export type SortDirection = 'asc' | 'desc';

type SortableTableHeadProps<T extends string> = {
  label: string;
  column: T;
  activeColumn: T | null;
  direction: SortDirection;
  onSort: (column: T) => void;
  className?: string;
};

export function SortableTableHead<T extends string>({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  className,
}: SortableTableHeadProps<T>) {
  const isActive = activeColumn === column;
  const SortIcon = !isActive
    ? ArrowUpDown
    : direction === 'asc'
      ? ArrowUp
      : ArrowDown;

  return (
    <th className={compactTableHeadCellClassName(className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'group inline-flex items-center gap-1 rounded px-0.5 py-0.5 transition-colors',
          'hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
        aria-sort={
          isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
        }
      >
        <span>{label}</span>
        <SortIcon
          className={cn(
            'size-3 shrink-0',
            isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-70',
          )}
          aria-hidden
        />
      </button>
    </th>
  );
}
