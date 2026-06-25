'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { ChevronDown } from 'lucide-react';

import { cn } from '@lilog/ui';

import type { NavSubgroup } from './sidebar.types';
import { isNavSubgroup, isNavSubgroupActive } from './sidebar.types';
import { SidebarNavItem } from './sidebar-nav-item';

export type SidebarNavSubgroupProps = {
  subgroup: NavSubgroup;
};

export function SidebarNavSubgroup({ subgroup }: SidebarNavSubgroupProps) {
  const pathname = usePathname();
  const routeActive = isNavSubgroupActive(pathname, subgroup);
  const [isOpen, setIsOpen] = useState(false);

  const SubgroupIcon = subgroup.icon;

  return (
    <div className="space-y-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-150',
          routeActive
            ? 'text-primary'
            : 'text-muted-foreground hover:bg-surface-high hover:text-foreground',
        )}
        aria-expanded={isOpen}
        aria-controls={`sidebar-subgroup-${subgroup.id}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <SubgroupIcon aria-hidden className="size-3.5 shrink-0" />
          <span className="truncate text-xs font-semibold leading-none">
            {subgroup.label}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            'size-3 shrink-0 opacity-60 transition-transform duration-200',
            isOpen ? 'rotate-180' : 'rotate-0',
          )}
        />
      </button>

      <div
        id={`sidebar-subgroup-${subgroup.id}`}
        className={cn(
          'overflow-hidden pl-3 transition-[max-height,opacity] duration-200 ease-out',
          isOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="mt-0.5 space-y-0.5 border-l border-outline-variant/40 pb-2 pl-2">
          {subgroup.items.map((entry) =>
            isNavSubgroup(entry) ? (
              <SidebarNavSubgroup key={entry.id} subgroup={entry} />
            ) : (
              <SidebarNavItem key={entry.id} item={entry} collapsed={false} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
