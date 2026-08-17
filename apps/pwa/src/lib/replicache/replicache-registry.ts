import type { RecebimentoReplicache } from '@lilog/replicache-recebimento';

let activeReplicache: RecebimentoReplicache | null = null;

export function setActiveReplicache(rep: RecebimentoReplicache | null): void {
  activeReplicache = rep;
}

export function getActiveReplicache(): RecebimentoReplicache | null {
  return activeReplicache;
}
