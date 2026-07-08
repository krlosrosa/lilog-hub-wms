'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'portal-terceiros-sidebar-collapsed';

export function usePortalSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'true') setCollapsed(true);
      if (stored === 'false') setCollapsed(false);
    } catch {
      /* ignore */
    }
  }, []);

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

  return { collapsed, toggleCollapsed };
}
