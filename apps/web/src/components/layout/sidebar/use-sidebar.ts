'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { NavGroup } from './sidebar.types';
import { isNavSubgroupActive } from './sidebar.types';

const STORAGE_KEY = 'lilog-sidebar-collapsed';

function findActiveGroupId(pathname: string, groups: NavGroup[]): string | null {
  for (const group of groups) {
    if (isNavSubgroupActive(pathname, group)) {
      return group.id;
    }
  }
  return groups.find((g) => g.defaultOpen)?.id ?? null;
}

export function useSidebar(groups: NavGroup[]) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') setCollapsed(true);
      if (stored === 'false') setCollapsed(false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const activeGroupId = findActiveGroupId(pathname, groups);
    if (activeGroupId) {
      setOpenGroupId(activeGroupId);
    }
  }, [pathname, groups]);

  const persistCollapsed = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      persistCollapsed(next);
      return next;
    });
  }, [persistCollapsed]);

  /** One open group at a time; tapping the open header closes it. From collapsed rail: expand then open group. */
  const onGroupHeaderClick = useCallback(
    (groupId: string) => {
      if (collapsed) {
        setCollapsed(false);
        persistCollapsed(false);
        setOpenGroupId(groupId);
        return;
      }
      setOpenGroupId((current) => (current === groupId ? null : groupId));
    },
    [collapsed, persistCollapsed],
  );

  const openMobile = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return {
    collapsed,
    openGroupId,
    mobileOpen,
    toggleCollapsed,
    onGroupHeaderClick,
    openMobile,
    closeMobile,
    setMobileOpen,
  };
}
