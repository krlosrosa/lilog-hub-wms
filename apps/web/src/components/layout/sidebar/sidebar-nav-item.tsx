'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@lilog/ui';

import type { NavItem } from './sidebar.types';
import { isNavItemActive } from './sidebar.types';

export type SidebarNavItemProps = {
  item: NavItem;
  collapsed: boolean;
  className?: string;
};

export function SidebarNavItem({ item, collapsed, className }: SidebarNavItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = isNavItemActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
        collapsed && 'justify-center px-1.5',
        isActive
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-muted-foreground hover:text-primary',
        className,
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}
