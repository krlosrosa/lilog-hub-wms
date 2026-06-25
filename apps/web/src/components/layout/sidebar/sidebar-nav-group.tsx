'use client';

import { ChevronDown } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { NavGroup } from './sidebar.types';
import { isNavSubgroup } from './sidebar.types';
import { SidebarNavItem } from './sidebar-nav-item';
import { SidebarNavSubgroup } from './sidebar-nav-subgroup';

export type SidebarNavGroupProps = {
  group: NavGroup;
  collapsed: boolean;
  isOpen: boolean;
  onHeaderClick: (groupId: string) => void;
};

export function SidebarNavGroup({
  group,
  collapsed,
  isOpen,
  onHeaderClick,
}: SidebarNavGroupProps) {
  const GroupIcon = group.icon;

  return (
    <div className="space-y-0">
      <button
        type="button"
        onClick={() => onHeaderClick(group.id)}
        className={cn(
          'flex w-full items-center justify-between gap-1.5 rounded-md px-3 py-2 text-sm transition-colors duration-150',
          collapsed && 'justify-center px-1.5',
          'text-muted-foreground hover:bg-surface-high hover:text-foreground',
        )}
        aria-expanded={!collapsed && isOpen}
        title={collapsed ? group.label : undefined}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <GroupIcon aria-hidden className="size-4 shrink-0" />
          {!collapsed ? (
            <span className="truncate font-medium leading-none">{group.label}</span>
          ) : null}
        </span>
        {!collapsed ? (
          <ChevronDown
            aria-hidden
            className={cn(
              'size-3.5 shrink-0 opacity-60 transition-transform duration-200',
              isOpen ? 'rotate-180' : 'rotate-0',
            )}
          />
        ) : null}
      </button>

      {!collapsed && (
        <div
          id={`sidebar-submenu-${group.id}`}
          className={cn(
            'overflow-hidden pl-4 transition-[max-height,opacity] duration-200 ease-out',
            isOpen ? 'max-h-[48rem] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="mt-0.5 space-y-1 pb-1">
            {group.items.map((entry) =>
              isNavSubgroup(entry) ? (
                <SidebarNavSubgroup key={entry.id} subgroup={entry} />
              ) : (
                <SidebarNavItem key={entry.id} item={entry} collapsed={false} />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
