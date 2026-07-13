import { useMemo } from 'react';

import { resolveDockDisplayLabel } from '@/lib/offline/checklist-cache';

import { useDocasV2 } from './use-docas-v2';

export function useDockDisplayLabelV2(dockRef: string | null | undefined): string {
  const { dockOptions } = useDocasV2();

  return useMemo(
    () => resolveDockDisplayLabel(dockRef, dockOptions),
    [dockRef, dockOptions],
  );
}
