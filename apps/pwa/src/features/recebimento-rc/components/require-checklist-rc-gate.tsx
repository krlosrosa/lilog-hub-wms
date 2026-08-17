import { Loader2 } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { getChecklist, getDemanda } from '@lilog/replicache-recebimento';
import type { ReadTransaction } from 'replicache';
import { useReplicache } from '@/lib/replicache/hooks';

import { useLocalChecklistCompleteRc } from '../hooks/use-checklist-rc';
import { resolveDemandEntryRoute } from '../hooks/use-demand-entry-route';

type GateStatus = 'loading' | 'allowed' | 'redirect';

function resolveGateStatus(
  demand: Awaited<ReturnType<typeof getDemanda>>,
  checklist: Awaited<ReturnType<typeof getChecklist>>,
  hasLocalChecklistComplete: boolean,
): GateStatus {
  return resolveDemandEntryRoute(demand, checklist, hasLocalChecklistComplete) ===
    '/recebimento-rc/$id/itens'
    ? 'allowed'
    : 'redirect';
}

interface RequireChecklistRcGateProps {
  demandId: string;
  skipCheck?: boolean;
  children: ReactNode;
}

export function RequireChecklistRcGate({
  demandId,
  skipCheck = false,
  children,
}: RequireChecklistRcGateProps) {
  const navigate = useNavigate();
  const { rep, isReady } = useReplicache();
  const hasLocalChecklistComplete = useLocalChecklistCompleteRc(demandId);
  const [status, setStatus] = useState<GateStatus>('loading');

  useEffect(() => {
    if (skipCheck) {
      setStatus('allowed');
      return;
    }

    if (hasLocalChecklistComplete === undefined) {
      setStatus('loading');
      return;
    }

    if (hasLocalChecklistComplete === true) {
      setStatus('allowed');
      return;
    }

    if (!rep || !isReady) {
      setStatus('loading');
      return;
    }

    const read = (tx: ReadTransaction) =>
      Promise.all([getChecklist(tx, demandId), getDemanda(tx, demandId)]).then(
        ([checklist, demand]) => resolveGateStatus(demand, checklist, false),
      );

    return rep.subscribe(read, {
      onData: setStatus,
    });
  }, [rep, isReady, demandId, skipCheck, hasLocalChecklistComplete]);

  useEffect(() => {
    if (skipCheck || status !== 'redirect') {
      return;
    }

    void navigate({
      to: '/recebimento-rc/$id/checklist',
      params: { id: demandId },
      replace: true,
    });
  }, [skipCheck, status, navigate, demandId]);

  if (skipCheck) {
    return children;
  }

  if (!isReady || status === 'loading' || status === 'redirect') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" aria-hidden />
      </div>
    );
  }

  return children;
}
