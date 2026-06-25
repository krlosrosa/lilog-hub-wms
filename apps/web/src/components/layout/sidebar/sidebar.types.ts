import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
};

export type NavSubgroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** When true, subgroup starts open if no route match applies */
  defaultOpen?: boolean;
  items: NavEntry[];
};

export type NavEntry = NavItem | NavSubgroup;

export function isNavSubgroup(entry: NavEntry): entry is NavSubgroup {
  return 'items' in entry && !('href' in entry);
}

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** When true and no other accordion state applies, group starts open */
  defaultOpen?: boolean;
  items: NavEntry[];
};

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname === '';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavEntryActive(pathname: string, entry: NavEntry): boolean {
  if (isNavSubgroup(entry)) {
    return isNavSubgroupActive(pathname, entry);
  }
  return isNavItemActive(pathname, entry.href);
}

export function isNavSubgroupActive(
  pathname: string,
  subgroup: NavSubgroup,
): boolean {
  return subgroup.items.some((entry) => isNavEntryActive(pathname, entry));
}
